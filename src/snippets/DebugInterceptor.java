public class DebugInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(final HttpRequest request,
                                        final byte[] body,
                                        final ClientHttpRequestExecution execution) {

        if (Boolean.parseBoolean(MDC.get("DEBUG"))) {
            request.getHeaders().set("Debug", Boolean.TRUE.toString());
        }
        return execution.execute(request, body);
    }
}