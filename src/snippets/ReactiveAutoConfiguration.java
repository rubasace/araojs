@ConditionalOnWebApplication(type = REACTIVE)
@Configuration
class ReactiveAutoConfiguration {

    @Bean
    public SomeReactiveComponent(){
        return new SomeReactiveComponent();
    }

}