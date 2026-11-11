@Component
class PubSubTemplatePostProcessor implements BeanPostProcessor {

    @Override
    Object postProcessAfterInitialization(Object bean, String beanName) {
        if(!(bean instanceof PubSubTemplate)){
            return bean;
        }
        return new PubSubTemplateWrapper((PubSubTemplate) bean);
    }

}