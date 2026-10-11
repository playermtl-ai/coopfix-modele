package com.patrickmatte.coopfix;
import org.junit.Test;
import static org.junit.Assert.*;
public class CoopUrlTest {
    @Test public void acceptsPublicCoopOrigins() {
        assertEquals("https://ma-coop.example.ca", CoopUrl.normalize("ma-coop.example.ca"));
        assertEquals("https://ma-coop.example.ca", CoopUrl.normalize("https://ma-coop.example.ca/login"));
    }
    @Test public void rejectsUnsafeQrAndCredentials() {
        String[] bad = {"http://coop.example.ca", "javascript:alert(1)", "https://a:b@coop.example.ca",
            "https://127.0.0.1", "https://localhost", "https://a.local", "https://coop.example.ca:8080",
            "https://coop.example.ca/?token=secret", "https://coop.example.ca/#access_token=secret",
            "https://coop.example.ca/unknown", "https://coop..example.ca", "https://-coop.example.ca"};
        for (String url : bad) {
            try { CoopUrl.normalize(url); fail(url); } catch (IllegalArgumentException expected) {}
        }
    }
    @Test public void confinesWebViewToSelectedOrigin() {
        assertTrue(CoopUrl.sameOrigin("https://coop.example.ca","https://coop.example.ca/profil"));
        assertFalse(CoopUrl.sameOrigin("https://coop.example.ca","https://coop.example.ca.evil.test"));
        assertFalse(CoopUrl.sameOrigin("https://coop.example.ca","http://coop.example.ca"));
        assertFalse(CoopUrl.sameOrigin("https://coop.example.ca","https://other.example.ca"));
    }
}
