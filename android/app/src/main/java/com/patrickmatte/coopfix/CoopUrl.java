package com.patrickmatte.coopfix;

import java.net.IDN;
import java.net.URI;
import java.util.Locale;

/** Accept only a public HTTPS origin, never credentials, an IP, or a path from a QR code. */
public final class CoopUrl {
    private CoopUrl() {}
    public static String normalize(String raw) {
        if (raw == null) throw new IllegalArgumentException("Inscrivez l’adresse du site de votre coop.");
        String value = raw.trim();
        if (!value.contains("://")) value = "https://" + value;
        try {
            URI uri = new URI(value);
            String host = uri.getHost();
            String path = uri.getPath();
            if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null
                || uri.getRawUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443)
                || uri.getRawQuery() != null || uri.getRawFragment() != null
                || !(path == null || path.isEmpty() || path.equals("/") || path.equals("/login"))) {
                throw new IllegalArgumentException();
            }
            host = IDN.toASCII(host).toLowerCase(Locale.ROOT);
            if (host.length() > 253 || !host.matches("(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?")
                || !host.contains(".") || host.matches("[0-9.]+")
                || host.endsWith(".localhost") || host.endsWith(".local")
                || host.endsWith(".internal") || host.contains("..")) throw new IllegalArgumentException();
            for (String label : host.split("\\.")) {
                if (label.length() > 63 || label.startsWith("-") || label.endsWith("-"))
                    throw new IllegalArgumentException();
            }
            return "https://" + host;
        } catch (Exception invalid) {
            throw new IllegalArgumentException("Utilisez l’adresse HTTPS publique de votre coop, sans mot de passe ni paramètres.");
        }
    }
    public static boolean sameOrigin(String origin, String target) {
        try {
            URI base = new URI(origin), next = new URI(target);
            return "https".equalsIgnoreCase(next.getScheme()) && next.getRawUserInfo() == null
                && base.getHost().equalsIgnoreCase(next.getHost())
                && (next.getPort() == -1 || next.getPort() == 443);
        } catch (Exception invalid) { return false; }
    }
}
