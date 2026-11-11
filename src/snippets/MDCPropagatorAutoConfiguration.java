@ConditionalOnClass(ReactorContextMDCPropagator.class})
@Configuration
public class MDCPropagatorAutoConfiguration {

    @ConditionalOnMissingBean
    @Bean
    ReactorContextMDCPropagator reactorContextMDCPropagator() {
        return new DefaultReactorContextMDCPropagator();
    }

}