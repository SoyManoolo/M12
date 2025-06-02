export async function getToken(request: Request): Promise<string | null> {
    const cookieHeader = request.headers.get("Cookie");
    const token = cookieHeader?.split(";")
        .find((c: string) => c.trim().startsWith("token="))
        ?.split("=")[1];
    return token || null;
} 