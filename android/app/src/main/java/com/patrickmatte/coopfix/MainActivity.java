package com.patrickmatte.coopfix;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.*;
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import org.json.JSONObject;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private WebView web;
    private LinearLayout root;
    private TextView message;
    private EditText address;
    private Button connect;
    private String origin;
    private int attempt;
    private boolean destroyed;
    private final int burgundy = Color.rgb(166,25,50);

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (Build.VERSION.SDK_INT >= 33)
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::navigateBack);
        String saved = getPreferences(MODE_PRIVATE).getString("coop_origin", null);
        if (saved == null) showWelcome();
        else {
            try { openCoop(CoopUrl.normalize(saved)); }
            catch (IllegalArgumentException invalid) { showWelcome(); }
        }
    }
    private int dp(int n) { return Math.round(n * getResources().getDisplayMetrics().density); }
    private void makeRoot() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(252,249,243));
        root.setOnApplyWindowInsetsListener((view,insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                view.setPadding(bars.left,bars.top,bars.right,bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        setContentView(root);
    }
    private TextView text(String value, int size) {
        TextView view = new TextView(this);
        view.setText(value); view.setTextSize(size); view.setTextColor(Color.rgb(51,33,39));
        view.setPadding(dp(8),dp(10),dp(8),dp(10));
        return view;
    }
    private Button button(String title, View.OnClickListener action) {
        Button b = new Button(this); b.setText(title); b.setAllCaps(false);
        b.setTextColor(burgundy); b.setOnClickListener(action); return b;
    }
    private void showWelcome() {
        attempt++;
        if (web != null) { web.destroy(); web = null; }
        origin = null; makeRoot();
        ScrollView scroll = new ScrollView(this);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL); content.setPadding(dp(24),dp(20),dp(24),dp(24));
        scroll.addView(content); root.addView(scroll);
        ImageView logo = new ImageView(this);
        logo.setImageResource(com.patrickmatte.coopfix.R.mipmap.ic_launcher);
        logo.setContentDescription("CoopFix");
        content.addView(logo,new LinearLayout.LayoutParams(dp(130),dp(130)));
        content.addView(text("Bienvenue dans CoopFix",28));
        content.addView(text("Entrez l’adresse du site fournie par votre coopérative, ou scannez son code QR. Votre choix sera conservé sur ce téléphone.",17));
        address = new EditText(this);
        address.setHint("https://votre-coop.ca");
        address.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        address.setSingleLine(true); address.setSelectAllOnFocus(true);
        address.setContentDescription("Adresse du site de votre coopérative");
        content.addView(address);
        connect = button("Ouvrir ma coop", v -> verifyCoop());
        content.addView(connect);
        content.addView(button("Scanner le code QR de ma coop", v ->
            GmsBarcodeScanning.getClient(this,new GmsBarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE).enableAutoZoom().build()).startScan()
                .addOnSuccessListener(code -> {
                    if (destroyed || address == null) return;
                    try {
                        address.setText(CoopUrl.normalize(code.getRawValue()));
                        message.setText("Vérifiez l’adresse affichée, puis touchez « Ouvrir ma coop ».");
                    } catch (IllegalArgumentException invalid) { message.setText(invalid.getMessage()); }
                })
                .addOnFailureListener(error -> {
                    if (!destroyed && message != null) message.setText("Le lecteur QR n’est pas disponible. Vous pouvez entrer l’adresse de votre coop.");
                })));
        message = text("",16); message.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        content.addView(message);
        content.addView(button("Confidentialité",v -> showPrivacy()));
        content.addView(button("Demander la suppression de mon compte",v -> requestDeletion()));
    }
    private void verifyCoop() {
        final String chosen;
        try { chosen = CoopUrl.normalize(address.getText().toString()); }
        catch (IllegalArgumentException invalid) { message.setText(invalid.getMessage()); return; }
        final int currentAttempt = ++attempt;
        connect.setEnabled(false); message.setText("Vérification du site de votre coop…");
        worker.execute(() -> {
            boolean valid = false;
            HttpURLConnection connection = null;
            try {
                for (InetAddress ip : InetAddress.getAllByName(new URI(chosen).getHost()))
                    if (ip.isLoopbackAddress() || ip.isSiteLocalAddress() || ip.isLinkLocalAddress()
                        || ip.isAnyLocalAddress() || ip.isMulticastAddress()) throw new Exception("Private address");
                connection = (HttpURLConnection)new URL(chosen+"/.well-known/coopfix.json").openConnection();
                connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(10000); connection.setReadTimeout(10000);
                if (connection.getResponseCode() == 200) {
                    java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
                    try (java.io.InputStream input = connection.getInputStream()) {
                        byte[] buffer = new byte[1024];
                        int count;
                        while (body.size() <= 4096 && (count = input.read(buffer, 0,
                                Math.min(buffer.length, 4097 - body.size()))) != -1) body.write(buffer, 0, count);
                    }
                    byte[] bytes = body.toByteArray();
                    if (bytes.length <= 4096) {
                        JSONObject marker = new JSONObject(new String(bytes,StandardCharsets.UTF_8));
                        valid = "CoopFix".equals(marker.optString("application")) && marker.optInt("protocol") == 1;
                    }
                }
            } catch (Exception ignored) { /* Never expose server content or connection details to the UI. */ }
            finally { if (connection != null) connection.disconnect(); }
            final boolean accepted = valid;
            runOnUiThread(() -> {
                if (destroyed || currentAttempt != attempt) return;
                connect.setEnabled(true);
                if (!accepted) {
                    message.setText("Ce site ne répond pas comme une installation CoopFix compatible. Vérifiez l’adresse avec votre coordination et votre connexion Internet.");
                    return;
                }
                new AlertDialog.Builder(this).setTitle("Ouvrir votre coop ?")
                    .setMessage("Vous allez vous connecter au site suivant :\n\n"+chosen+"\n\nAssurez-vous que cette adresse vous a été fournie par votre coopérative.")
                    .setPositiveButton("Continuer",(dialog,which) -> {
                        getPreferences(MODE_PRIVATE).edit().putString("coop_origin",chosen).apply();
                        openCoop(chosen);
                    }).setNegativeButton("Annuler",null).show();
            });
        });
    }
    @SuppressWarnings("SetJavaScriptEnabled")
    private void openCoop(String chosen) {
        origin = chosen; makeRoot();
        LinearLayout bar = new LinearLayout(this);
        TextView site = text(Uri.parse(chosen).getHost(),14);
        site.setSingleLine(true);
        bar.addView(site,new LinearLayout.LayoutParams(0,dp(50),1));
        bar.addView(button("⋮",this::showMenu));
        root.addView(bar);
        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false); settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setSupportMultipleWindows(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        WebView.setWebContentsDebuggingEnabled(false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String target = request.getUrl().toString();
                if (CoopUrl.sameOrigin(origin,target)) return false;
                if (request.isForMainFrame() && request.hasGesture()) openExternal(target);
                return true;
            }
            @Override public void onReceivedSslError(WebView view,SslErrorHandler handler,SslError error) {
                handler.cancel();
                new AlertDialog.Builder(MainActivity.this).setTitle("Connexion sécurisée impossible")
                    .setMessage("Le certificat du site doit être corrigé par votre coordination.")
                    .setPositiveButton("Fermer",null).show();
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error) {
                if (request.isForMainFrame())
                    new AlertDialog.Builder(MainActivity.this).setTitle("Site momentanément inaccessible")
                        .setMessage("Vérifiez votre connexion Internet. Vos billets restent dans le site de votre coop.")
                        .setPositiveButton("Réessayer",(d,w) -> view.loadUrl(origin+"/"))
                        .setNegativeButton("Fermer",null).show();
            }
        });
        root.addView(web,new LinearLayout.LayoutParams(-1,0,1));
        web.loadUrl(chosen+"/");
    }
    private void showMenu(View anchor) {
        PopupMenu menu = new PopupMenu(this,anchor);
        menu.getMenu().add("Actualiser").setOnMenuItemClickListener(item -> { web.reload(); return true; });
        menu.getMenu().add("Confidentialité").setOnMenuItemClickListener(item -> { web.loadUrl(origin+"/confidentialite.html"); return true; });
        menu.getMenu().add("Supprimer mon compte").setOnMenuItemClickListener(item -> { web.loadUrl(origin+"/suppression-compte.html"); return true; });
        menu.getMenu().add("Changer de coop").setOnMenuItemClickListener(item -> {
            new AlertDialog.Builder(this).setTitle("Changer de coop ?")
                .setMessage("Les connexions enregistrées sur ce téléphone seront effacées. Vos comptes et billets dans les coops seront conservés.")
                .setPositiveButton("Changer",(d,w) -> {
                    if (web != null) { web.stopLoading(); web.clearHistory(); web.clearCache(true); }
                    WebStorage.getInstance().deleteAllData();
                    getPreferences(MODE_PRIVATE).edit().remove("coop_origin").apply();
                    CookieManager.getInstance().removeAllCookies(done -> { CookieManager.getInstance().flush(); showWelcome(); });
                }).setNegativeButton("Annuler",null).show();
            return true;
        });
        menu.show();
    }
    private void showPrivacy() {
        new AlertDialog.Builder(this).setTitle("Confidentialité — CoopFix")
            .setMessage("L’adresse de votre coop et sa session sont conservées sur ce téléphone. Les comptes, coordonnées, billets et commentaires sont traités par l’installation de votre coopérative. Avant de créer un compte, consultez sa politique de confidentialité. Le scanner QR utilise Google Play services, avec traitement sur l’appareil. Aucune publicité n’est intégrée dans CoopFix.\n\nÉditeur : Patrick Matte\nSoutien : playermtl@gmail.com")
            .setPositiveButton("Fermer",null).show();
    }
    private void requestDeletion() {
        openExternal("mailto:playermtl@gmail.com?subject="+Uri.encode("CoopFix — demande de suppression de compte")
            +"&body="+Uri.encode("Bonjour,\nJe souhaite demander la suppression de mon compte CoopFix.\nAdresse du site de ma coop : \nCourriel de mon compte : \n\nMerci."));
    }
    private void openExternal(String target) {
        Uri uri = Uri.parse(target);
        String scheme = uri.getScheme();
        if (!"https".equals(scheme) && !"mailto".equals(scheme) && !"tel".equals(scheme)) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); }
        catch (ActivityNotFoundException unavailable) { Toast.makeText(this,"Aucune application disponible pour ouvrir ce lien.",Toast.LENGTH_LONG).show(); }
    }
    private void navigateBack() {
        if (web != null && web.canGoBack()) web.goBack();
        else finish();
    }
    // API 33+ uses the OnBackInvokedDispatcher registered in onCreate; this handles older devices.
    @android.annotation.SuppressLint("GestureBackNavigation")
    @Override public void onBackPressed() { navigateBack(); }
    @Override protected void onPause() { if (web != null) web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        destroyed=true; attempt++; worker.shutdownNow();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
