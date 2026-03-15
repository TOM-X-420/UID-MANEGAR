export async function silentTrack(actionType: string, inputData?: string, inputCount?: number) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip_address: "client",
        device_info: navigator.userAgent,
        screen_size: `${screen.width}x${screen.height}`,
        browser_info: navigator.vendor,
        language: navigator.language,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        input_data: inputData ?? null,
        input_count: inputCount ?? null,
        action_type: actionType,
      }),
    });
  } catch {
    // Silent - never expose tracking errors to user
  }
}
