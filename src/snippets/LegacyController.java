@RestController
@RequestMapping(value = "/test")
class ApplicationController extends FrameworkController {

    private final ApplicationService applicationService;

    @PostMapping
    public TestResponse test(final TestRequest testRequest) {
        return super.decorateCall(/*...*/);
    }
}