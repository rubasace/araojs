@ConstructorBinding
@ConfigurationProperties(prefix = "framework.properties.example")
public class ExampleConfigurationProperties {

    private final Duration timeout;
    private final StrategyEnum strategy;

    public RuleFilteringProperties(final Duration timeout,
                                   final StrategyEnum strategy) {
        this.timeout = timeout;
        this.strategy = strategy;
    }

    //Getters...
}