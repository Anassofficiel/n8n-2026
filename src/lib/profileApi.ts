import { supabase } from "./supabase";

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;

function getEvolutionHeaders() {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        throw new Error("Evolution API environment variables are missing.");
    }

    return {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
    };
}

async function evolutionRequest<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(`${EVOLUTION_API_URL}${path}`, {
        ...options,
        headers: {
            ...getEvolutionHeaders(),
            ...(options?.headers || {}),
        },
    });

    const text = await response.text();
    let data: unknown = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        const errorMessage =
            typeof data === "object" && data !== null
                ? JSON.stringify(data)
                : typeof data === "string"
                    ? data
                    : `Evolution API request failed with status ${response.status}`;

        throw new Error(errorMessage);
    }

    return data as T;
}

type SendTextMessageParams = {
    profileId: string;
    to: string;
    message: string;
};

type EvolutionConnectionStateResponse = {
    instance?: {
        instanceName?: string;
        state?: string;
    };
};

type EvolutionConnectResponse = {
    pairingCode?: string | null;
    code?: string | null;
    base64?: string | null;
    count?: number;
};

type EvolutionCreateInstanceResponse = unknown;

function normalizeState(state?: string | null): "connected" | "not_connected" {
    const normalized = (state || "").toLowerCase();

    if (
        normalized === "open" ||
        normalized === "connected" ||
        normalized === "online"
    ) {
        return "connected";
    }

    return "not_connected";
}

function normalizePhoneNumber(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, "");

    if (!digitsOnly) {
        throw new Error("Phone number is required.");
    }

    return `${digitsOnly}@s.whatsapp.net`;
}

function generateInstanceName() {
    return `profile_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

async function getProfileById(profileId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, name, instance_name, connection_status, phone_number")
        .eq("id", profileId)
        .single();

    if (error) throw error;
    if (!data?.instance_name) {
        throw new Error("Profile instance_name is missing.");
    }

    return data;
}

async function getEvolutionConnectionState(
    instanceName: string
): Promise<"connected" | "not_connected"> {
    try {
        const data = await evolutionRequest<EvolutionConnectionStateResponse>(
            `/instance/connectionState/${instanceName}`,
            {
                method: "GET",
            }
        );

        return normalizeState(data?.instance?.state);
    } catch {
        return "not_connected";
    }
}

async function createEvolutionInstance(instanceName: string) {
    try {
        const data = await evolutionRequest<EvolutionCreateInstanceResponse>(
            `/instance/create`,
            {
                method: "POST",
                body: JSON.stringify({
                    instanceName,
                    integration: "WHATSAPP-BAILEYS",
                    qrcode: true,
                }),
            }
        );

        return data;
    } catch (error) {
        const message =
            error instanceof Error ? error.message.toLowerCase() : "";

        if (
            message.includes("already exists") ||
            message.includes("instance already exists") ||
            message.includes("conflict") ||
            message.includes("already in use") ||
            message.includes("this name")
        ) {
            return null;
        }

        throw error;
    }
}

async function getEvolutionQr(instanceName: string) {
    const data = await evolutionRequest<EvolutionConnectResponse>(
        `/instance/connect/${instanceName}`,
        {
            method: "GET",
        }
    );

    return {
        qrCode: data?.base64 || null,
        pairingCode: data?.pairingCode || data?.code || null,
    };
}

export async function checkWhatsAppConnection(profileId: string) {
    const profile = await getProfileById(profileId);
    return getEvolutionConnectionState(profile.instance_name);
}

export async function getProfiles() {
    const { data, error } = await supabase
        .from("profiles")
        .select(`
      *,
      assistant_configs (
        profile_id,
        assistant_name,
        assistant_type,
        ai_provider,
        system_prompt,
        knowledge_base,
        voice_enabled,
        is_active
      ),
      whatsapp_sessions (
        profile_id,
        session_id,
        status,
        qr_code,
        connected_at,
        updated_at,
        instance_name,
        pairing_code
      )
    `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    const syncedProfiles = await Promise.all(
        (data || []).map(async (profile: any) => {
            const instanceName = profile.instance_name;

            if (!instanceName) {
                return profile;
            }

            const realConnectionState = await getEvolutionConnectionState(instanceName);
            const shouldBeConnected = realConnectionState === "connected";
            const nextProfileStatus = shouldBeConnected ? "connected" : "not_connected";
            const nextSessionStatus = shouldBeConnected ? "connected" : "not_connected";

            if (profile.connection_status !== nextProfileStatus) {
                const { error: updateProfileError } = await supabase
                    .from("profiles")
                    .update({
                        connection_status: nextProfileStatus,
                    })
                    .eq("id", profile.id);

                if (updateProfileError) {
                    throw updateProfileError;
                }
            }

            const currentSession = Array.isArray(profile.whatsapp_sessions)
                ? profile.whatsapp_sessions[0]
                : profile.whatsapp_sessions || null;

            const { error: updateSessionError } = await supabase
                .from("whatsapp_sessions")
                .upsert(
                    [
                        {
                            profile_id: profile.id,
                            session_id: instanceName,
                            instance_name: instanceName,
                            status: nextSessionStatus,
                            qr_code: currentSession?.qr_code ?? null,
                            pairing_code: currentSession?.pairing_code ?? null,
                            connected_at: shouldBeConnected
                                ? currentSession?.connected_at || new Date().toISOString()
                                : null,
                            updated_at: new Date().toISOString(),
                        },
                    ],
                    { onConflict: "profile_id" }
                );

            if (updateSessionError) {
                throw updateSessionError;
            }

            if (!shouldBeConnected) {
                const { error: assistantError } = await supabase
                    .from("assistant_configs")
                    .update({ is_active: false })
                    .eq("profile_id", profile.id);

                if (assistantError) {
                    throw assistantError;
                }
            }

            return {
                ...profile,
                connection_status: nextProfileStatus,
                whatsapp_sessions: [
                    {
                        profile_id: profile.id,
                        session_id: instanceName,
                        instance_name: instanceName,
                        status: nextSessionStatus,
                        qr_code: currentSession?.qr_code ?? null,
                        pairing_code: currentSession?.pairing_code ?? null,
                        connected_at: shouldBeConnected
                            ? currentSession?.connected_at || new Date().toISOString()
                            : null,
                        updated_at: new Date().toISOString(),
                    },
                ],
            };
        })
    );

    return syncedProfiles;
}

export async function createProfile(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
        throw new Error("Profile name is required.");
    }

    const instanceName = generateInstanceName();

    // 1) create profile
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert([
            {
                name: trimmedName,
                connection_status: "not_connected",
                phone_number: null,
                instance_name: instanceName,
            },
        ])
        .select()
        .single();

    if (profileError) throw profileError;

    try {
        // 2) create assistant default config
        const { error: assistantError } = await supabase
            .from("assistant_configs")
            .insert([
                {
                    profile_id: profile.id,
                    assistant_name: `${trimmedName} Bot`,
                    assistant_type: "Normal Q&A",
                    ai_provider: "Gemini Flash",
                    system_prompt: "You are a helpful WhatsApp assistant.",
                    knowledge_base: "",
                    voice_enabled: true,
                    is_active: false,
                },
            ]);

        if (assistantError) throw assistantError;

        // 3) create default whatsapp session row
        const { error: sessionError } = await supabase
            .from("whatsapp_sessions")
            .insert([
                {
                    profile_id: profile.id,
                    session_id: instanceName,
                    instance_name: instanceName,
                    status: "not_connected",
                    qr_code: null,
                    pairing_code: null,
                    connected_at: null,
                    updated_at: new Date().toISOString(),
                },
            ]);

        if (sessionError) throw sessionError;

        // 4) create evolution instance
        await createEvolutionInstance(instanceName);

        return profile;
    } catch (error) {
        // rollback باش مايبقاش profile يتيم
        await supabase.from("whatsapp_sessions").delete().eq("profile_id", profile.id);
        await supabase.from("assistant_configs").delete().eq("profile_id", profile.id);
        await supabase.from("profiles").delete().eq("id", profile.id);
        throw error;
    }
}

export async function deleteProfile(id: string) {
    const profile = await getProfileById(id);

    const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);

    if (error) throw error;
}

export async function saveAssistantConfig(
    profileId: string,
    config: {
        name: string;
        type: string;
        provider: string;
        systemPrompt: string;
        knowledgeBase: string;
        voiceResponse: boolean;
        isActive: boolean;
    }
) {
    const profile = await getProfileById(profileId);
    const realConnectionState = await getEvolutionConnectionState(profile.instance_name);

    const safeIsActive =
        realConnectionState === "connected" ? config.isActive : false;

    const { data, error } = await supabase
        .from("assistant_configs")
        .upsert(
            [
                {
                    profile_id: profileId,
                    assistant_name: config.name,
                    assistant_type: config.type,
                    ai_provider: config.provider,
                    system_prompt: config.systemPrompt,
                    knowledge_base: config.knowledgeBase,
                    voice_enabled: config.voiceResponse,
                    is_active: safeIsActive,
                },
            ],
            { onConflict: "profile_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function connectWhatsApp(profileId: string) {
    const profile = await getProfileById(profileId);
    const instanceName = profile.instance_name;

    await createEvolutionInstance(instanceName);

    const qr = await getEvolutionQr(instanceName);

    const { error: profileError } = await supabase
        .from("profiles")
        .update({
            connection_status: "not_connected",
        })
        .eq("id", profileId);

    if (profileError) throw profileError;

    const { data, error: sessionError } = await supabase
        .from("whatsapp_sessions")
        .upsert(
            [
                {
                    profile_id: profileId,
                    status: "not_connected",
                    session_id: instanceName,
                    instance_name: instanceName,
                    qr_code: qr.qrCode,
                    pairing_code: qr.pairingCode,
                    connected_at: null,
                    updated_at: new Date().toISOString(),
                },
            ],
            { onConflict: "profile_id" }
        )
        .select()
        .single();

    if (sessionError) throw sessionError;

    return data;
}

export async function disconnectWhatsApp(profileId: string) {
    const profile = await getProfileById(profileId);
    const instanceName = profile.instance_name;

    const { error: profileError } = await supabase
        .from("profiles")
        .update({
            connection_status: "not_connected",
            phone_number: null,
        })
        .eq("id", profileId);

    if (profileError) throw profileError;

    const { error: sessionError } = await supabase
        .from("whatsapp_sessions")
        .upsert(
            [
                {
                    profile_id: profileId,
                    status: "not_connected",
                    session_id: instanceName,
                    instance_name: instanceName,
                    qr_code: null,
                    pairing_code: null,
                    connected_at: null,
                    updated_at: new Date().toISOString(),
                },
            ],
            { onConflict: "profile_id" }
        );

    if (sessionError) throw sessionError;

    const { error: assistantError } = await supabase
        .from("assistant_configs")
        .update({
            is_active: false,
        })
        .eq("profile_id", profileId);

    if (assistantError) throw assistantError;

    return true;
}

export async function sendWhatsAppTextMessage({
    profileId,
    to,
    message,
}: SendTextMessageParams) {
    const profile = await getProfileById(profileId);
    const state = await getEvolutionConnectionState(profile.instance_name);

    if (state !== "connected") {
        throw new Error(
            `Evolution instance "${profile.instance_name}" is not connected.`
        );
    }

    const number = normalizePhoneNumber(to);

    const data = await evolutionRequest(
        `/message/sendText/${profile.instance_name}`,
        {
            method: "POST",
            body: JSON.stringify({
                number,
                text: message,
            }),
        }
    );

    return data;
}

export async function getWhatsAppSessionByProfileId(profileId: string) {
    const { data, error } = await supabase
        .from("whatsapp_sessions")
        .select(`
      profile_id,
      session_id,
      instance_name,
      status,
      qr_code,
      pairing_code,
      connected_at,
      updated_at
    `)
        .eq("profile_id", profileId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function refreshProfileConnectionState(profileId: string) {
    const profile = await getProfileById(profileId);
    const realConnectionState = await getEvolutionConnectionState(profile.instance_name);
    const isConnected = realConnectionState === "connected";

    const { error: profileError } = await supabase
        .from("profiles")
        .update({
            connection_status: isConnected ? "connected" : "not_connected",
        })
        .eq("id", profileId);

    if (profileError) throw profileError;

    const { error: sessionError } = await supabase
        .from("whatsapp_sessions")
        .upsert(
            [
                {
                    profile_id: profileId,
                    session_id: profile.instance_name,
                    instance_name: profile.instance_name,
                    status: isConnected ? "connected" : "not_connected",
                    updated_at: new Date().toISOString(),
                    connected_at: isConnected ? new Date().toISOString() : null,
                },
            ],
            { onConflict: "profile_id" }
        );

    if (sessionError) throw sessionError;

    if (isConnected) {
        const { data: assistantConfig } = await supabase
            .from("assistant_configs")
            .select("profile_id, is_active")
            .eq("profile_id", profileId)
            .maybeSingle();

        if (assistantConfig?.is_active === false) {
            // intentionally keep it disabled
        }
    }

    return isConnected ? "connected" : "not_connected";
}