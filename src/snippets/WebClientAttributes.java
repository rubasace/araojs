public class WebClientAttributes {

    private static final String LOG_REQUEST_BODY = "logRequestBodyAttr";
    private static final String LOG_REQUEST_BODY = "logResponseBodyAttr";
    private static final String QUALIFIER = "qualifierAttr";

    public static Consumer<Map<String, Object>> logRequestBody() {
        return attributes -> attributes.put(LOG_REQUEST_BODY, true);
    }

    public static Consumer<Map<String, Object>> logResponseBody() {
        return attributes -> attributes.put(LOG_RESPONSE_BODY, true);
    }

    public static Consumer<Map<String, Object>> metricsQualifier(final String qualifier) {
        return attributes -> attributes.put(QUALIFIER_ATTRIBUTE, qualifier);
    }

}
