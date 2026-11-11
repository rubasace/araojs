@Service
class ApplicationService {

    private final RestTemplate restTemplate;

    private ApplicationService(final RestTemplateBuilder builder) {
        this.restTemplate = builder.rootUri("http://anotherService")
                                   .build();
    }

    public TestResponse test(final TestRequest testRequest) {
       return restTemplate.postForObject("/test", testRequest, TestResponse.class);
    }
}