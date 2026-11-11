public class LoggingInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(final HttpRequest request,
                                        final byte[] body,
                                        final ClientHttpRequestExecution execution) {
        logRequest(request);
        ClientHttpResponse clientHttpResponse = execution.execute(request, body);
        logResponse(clientHttpResponse);
        return clientHttpResponse;
    }
}