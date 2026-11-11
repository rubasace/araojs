public class RestTemplateCustomizers {

    public static RestTemplateCustomizer logRequestBody() {
        return restTemplate -> getLoggingInterceptor(restTemplate).logRequestBody();
    }

    public static RestTemplateCustomizer logResponseBody() {
        return restTemplate -> getLoggingInterceptor(restTemplate).logResponseBody();
    }

    public static RestTemplateCustomizer compressRequest() {
        return restTemplate -> restTemplate.getInterceptors()
                                           .add(new CompressRequestInterceptor());
    }
}