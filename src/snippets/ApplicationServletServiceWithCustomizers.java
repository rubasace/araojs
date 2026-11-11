@Service
class ApplicationService {

    private final RestTemplate restTemplate;

    private ApplicationService(final RestTemplateBuilder builder) {
        this.restTemplate = builder.rootUri("http://anotherService")
                                   .additionalCustomizers(RestTemplateCustomizers.logRequestBody(),
                                                          RestTemplateCustomizers.compressRequest())
                                   .build();
    }

    public TestResponse test(final TestRequest testRequest) {
        return restTemplate.postForObject("/test", testRequest, TestResponse.class);
    }
}