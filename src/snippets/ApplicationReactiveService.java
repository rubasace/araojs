@Service
class ApplicationService {

    private final WebClient webClient;

    private ApplicationService(final WebClient.Builder builder) {
        this.webClient = builder.clone()
                                .baseUrl("http://anotherService")
                                .build();
    }

    public Mono<TestResponse> test(final TestRequest testRequest) {
        return webClient.post()
                        .bodyValue(testRequest)
                        .retrieve()
                        .bodyToMono(TestResponse.class);
    }
}