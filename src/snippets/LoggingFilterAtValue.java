@Component
public class LoggingFilter implements Filter {

    private final boolean logRequestBody;
    private final boolean logResponseBody;

    LoggingFilter(@Value("${framework.server.log.log-request-body}")
                  boolean logRequestBody
                  @Value("${framework.server.log.log-response-body}")
                  boolean logResponseBody) {

        this.logRequestBody = logRequestBody;
        this.logResponseBody = logResponseBody;

    }
    ...
}