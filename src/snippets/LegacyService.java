@Service
class ApplicationService {

    private final FrameworRestClient restClient;

    public TestResponse test(final TestRequest testRequest) {
       return restClient.post("/test", testRequest, TestResponse.class);
    }
}