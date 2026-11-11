@ConstructorBinding
@ConfigurationProperties(prefix = "framework.server.log")
public class LoggingConfigurationProperties {

    /** Flag to indicate if the request body should be logged **/
    private final boolean logRequestBody;
    /** Flag to indicate if the response body should be logged **/
    private final boolean logResponseBody;

    public RuleFilteringProperties(final boolean logRequestBody,
                                   final boolean logResponseBody) {
        this.logRequestBody = logRequestBody;
        this.logResponseBody = logResponseBody;
    }

    //Getters...
}