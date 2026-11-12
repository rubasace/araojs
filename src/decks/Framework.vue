<!-- "Building a Framework on top of Spring Boot", ported from my-slides (eagle.js) as a PoC.
     Same slide order, texts and step reveals. Old "step > n" (eagle.js) becomes v-step="n + 1";
     steps start at 1 in both.
     Pictures and icons are not in the repo: copy my-slides' src/assets/images/* and
     src/assets/icons/* into src/images (same file names, no subfolders). Until then each one
     shows as a dashed box with its name.
     Old background opacities were a black veil over the photo (0.6 = 60 % black); bg-opacity is
     the photo's own opacity over the slide colour, so each value here is 1 - the old one.
     Speaker notes: the section times are my-slides' times.txt (55:00 in all, so each section
     also says where in the talk it starts and ends); the two "presenter note" TODOs of
     FrameworkTalk.vue are on the BeanPostProcessor slides. -->
<template lang="pug">
Deck(:themes="['default', 'vigojug']")
  ProgressBar(position="bottom")
  SlideNumber

  //- ===== Opening =====
  Slide(layout="cover")
    template(#background)
      Img.fw-title-bg(file="kelly-sikkema--BwtFJgaUho-unsplash.jpg" position="6em 0" opacity="0.8")
    TitleContent
    Notes
      p Intro: title, raised hands, about me.
      p Section time (times.txt): 1:15 · from 0:00 to 1:15.

  //- FullTextSlide with only a background image and no text
  Slide(title="Raised hands (image)" bg="diverse-group-raised-hands.jpg" bg-opacity="0.9")

  Slide(title="About me")
    .fw-about
      .fw-about-panel
      Img.fw-about-pic(file="profilePic.jpg" rounded="full")
      .fw-about-info
        p.fw-about-name Rubén Pahíno Verdugo
        p.fw-about-role Tech Lead @Travix International
        .fw-about-social
          Social(icon="linkedin.svg") rubenpahino
          Social(icon="github.svg") rubasace

  //- ===== Why =====
  Slide(layout="section" bg="ana-municio-PbzntH58GLQ-unsplash.jpg" bg-opacity="0.4")
    h1 Why do we need a framework?
    Notes
      p Section time (times.txt): 3:00 · from 1:15 to 4:15.
      p Next: the production readiness picture, then communication, recording, traceability, security, scale.

  Slide(title="Production readiness (image)")
    Img(file="productionReadiness.png")

  Slide
    h2 Communication
    Cols(align="center" gap="sm")
      IconText(v-step="2" icon="serialization.svg" text="Serialization" size="8em")
      IconText(v-step="3" icon="error.png" text="Error Handling" size="8em")

  Slide
    h2 Recording
    Cols(align="center" gap="sm")
      IconText(v-step="2" icon="metrics.png" text="Metrics" size="8em")
      IconText(v-step="3" icon="logging.svg" text="Logging" size="8em")
      IconText(v-step="4" icon="password.png" text="Obfuscation" size="8em")

  Slide
    h2 Traceability
    Cols(align="center" gap="sm")
      IconText(v-step="2" icon="tracing.svg" text="Tracing" size="8em")
      IconText(v-step="3" icon="user.png" text="Session propagation" size="8em")

  Slide
    h2 Security
    Cols(align="center" gap="sm")
      IconText(v-step="2" icon="evaluate.png" text="Dependencies" size="8em")
      IconText(v-step="3" icon="lock.png" text="Exposure" size="8em")

  Slide
    h2 Scale
    Cols(align="center" gap="sm")
      IconText(v-step="2" icon="api.svg" text="150+" size="8em")
      IconText(v-step="3" icon="container.png" text="1000+" size="8em")

  //- ===== Previous approach =====
  Slide(layout="section" bg="pexels-elle-hughes-1408632.jpg" bg-opacity="0.4")
    h1 Previous Approach
    Notes
      p Section time (times.txt): 3:20 · from 4:15 to 7:35.
      p Next: manipulating controllers, services and extra beans; then the observed issues.

  Slide(title="Manipulate Controllers · ApplicationController.java")
    h2 Manipulate Controllers
    Snippet(file="LegacyController.java" name="ApplicationController.java" :highlights='{"3:extends FrameworkController": 2, "9": 3}')

  Slide(title="Manipulate Services · ApplicationService.java")
    h2 Manipulate Services
    Snippet(file="LegacyService.java" name="ApplicationService.java" :highlights='{"4": 2, "7": 3}')

  Slide(title="Add Extra Beans · ApplicationConfiguration.java")
    h2 Add Extra Beans
    Snippet(file="LegacyConfiguration.java" name="ApplicationConfiguration.java" :highlights='{"1": 2}')

  Slide(title="Reaction: grinning face")
    Center
      IconText(icon="grinning-face.svg" size="12.5em")

  Slide
    h2 Observed Issues
    .fw-issues
      IconText(v-step="2" side icon="loop1.png" text="Applications coupled to framework" size="3.5em" :upper="false")
      IconText(v-step="3" side icon="crystal-ball.png" text="Guessing developers requirements" size="3.5em" :upper="false")
      IconText(v-step="4" side icon="funnel.png" text="Bottleneck for new technologies" size="3.5em" :upper="false")
      IconText(v-step="5" side icon="trash.png" text="Useless knowledge for developers" size="3.5em" :upper="false")

  Slide(title="Reaction: grinning face (again)")
    Center
      IconText(icon="grinning-face.svg" size="12.5em")

  Slide(title="Reaction: slightly smiling face")
    Center
      IconText(icon="slightly-smiling-face.svg" size="12.5em")

  Slide(title="StackOverflow")
    Center.fw-stack
      IconText(icon="stack-overflow.png" text="StackOverflow" size="10em" text-size="2.5em" :upper="false")
      Img.fw-forbidden(v-step="2" file="forbidden.png")

  Slide(title="Reaction: slightly smiling face (again)")
    Center
      IconText(icon="slightly-smiling-face.svg" size="12.5em")

  Slide(title="Reaction: smiling face with tear")
    Center
      IconText(icon="smiling-face-with-tear.svg" size="12.5em")

  //- ===== Current approach =====
  Slide(layout="section" bg="pexels-pixabay-235990.jpg" bg-opacity="0.4")
    h1 Current Approach
    Notes
      p Section time (times.txt): 3:00 · from 7:35 to 10:35.

  Slide(title="Quote: Inversion of Control")
    Quote(author="Someone")
      | The key difference between a library and a framework is #[strong Inversion of Control]

  Slide
    h2 Design Objectives
    .fw-row
      IconText(v-step="2" icon="outOfTheBox.svg" text="out-of-the-box" size="6em")
      IconText(v-step="3" icon="transparent.svg" text="transparent" size="6em")
      IconText(v-step="4" icon="customizable.svg" text="customizable" size="6em")

  Slide
    h2 Production Readiness
    .fw-rows(v-step="2")
      .fw-row(v-for="row in readiness" :key="row[0].text")
        IconText(v-for="it in row" :key="it.text" :icon="it.icon" :text="it.text" size="4em" text-size="1.2em")

  Slide(title="Don't reinvent the wheel (image)")
    Img(file="caveman-wheel-cartoon.jpg")

  //- one title per step, and each feature highlighted in the step of its category
  Slide(title="Production Readiness → categories" v-slot="{ step }")
    h2(v-step.only.collapse="1") Production Readiness
    h2(v-step.only.collapse="2") Out-Of-The-Box Features
    h2(v-step.only.collapse="3") Need Tweaking
    h2(v-step.only.collapse="4") Missing Features
    .fw-rows
      .fw-row(v-for="row in readiness" :key="row[0].text")
        IconText(
          v-for="it in row" :key="it.text"
          :icon="it.icon" :text="it.text" size="4em" text-size="1.2em"
          :class="mark(step, it.category)"
        )
    Notes(step="2")
      p Out-of-the-box: Tracing, Dependencies.
    Notes(step="3")
      p Need tweaking: Serialization, Error, Metrics, Exposure.
    Notes(step="4")
      p Missing: Logging, Obfuscation, Session.

  //- ===== How to do it =====
  Slide(layout="section" bg="salty-justice-RsoqLSxscOg-unsplash.jpg" bg-opacity="0.4")
    h1 How to do it?
    Notes
      p Section time (times.txt): 24:10 · from 10:35 to 34:45.
      p The longest section of the talk.

  Slide
    h2 Out-Of-The-Box Features
    Cols(align="center" gap="sm")
      IconText(icon="tracing.svg" text="Tracing")
      IconText(icon="evaluate.png" text="Dependencies")

  Slide
    h2 Add Tracing
  Slide(title="Add Tracing · pom.xml")
    h2 Add Tracing
    Snippet(file="add-tracing.xml" name="pom.xml" :highlights='{"6-9": 2}')

  Slide
    h2 Control Dependencies
  Slide(title="Control Dependencies · pom.xml")
    h2 Control Dependencies
    Snippet(file="dependency-management.xml" name="pom.xml" :highlights='{"2": 2, "4-8": 3, "9-15": 4, "1-99": 5}')

  Slide
    h2 Provide starters
  Slide(title="Provide starters · starter pom.xml")
    h2 Provide starters
    Snippet(file="starter.xml" name="pom.xml" :highlights='{"2-3": 2, "4-25": 3}')
  Slide(title="Provide starters · framework starter pom.xml")
    h2 Provide starters
    Snippet(file="framework-starter.xml" name="pom.xml" :highlights='{"2-3": 2, "4-22": 3, "5-8": 4, "9-21": 5}')

  Slide
    h2 Need Tweaking
    .fw-row
      IconText(icon="serialization.svg" text="Serialization")
      IconText(icon="error.png" text="Error")
      IconText(icon="metrics.png" text="Metrics")
      IconText(icon="lock.png" text="Exposure")

  Slide
    h2 Configure Dependencies
    .fw-row
      IconText(v-step="2" icon="properties.png" text="Configuration Properties")
      IconText(v-step="3" icon="at.png" text="Provide instances")

  Slide
    h2 Configuration Properties
  Slide(title="Configuration Properties · application.properties")
    h2 Configuration Properties
    Snippet(file="application.properties")

  Slide(title="We have no control over app code!!")
    p.fw-statement We have no control over app code!!

  Slide(title="Configure Dependencies · application.properties")
    h2 Configure Dependencies
    Snippet(file="application.properties")
  Slide(title="Configure Dependencies · framework-metrics.properties")
    h2 Configure Dependencies
    Snippet(file="framework-metrics.properties")
  Slide(title="Configure Dependencies · MetricsPropertiesConfiguration.java")
    h2 Configure Dependencies
    Snippet(file="MetricsPropertiesConfiguration.java" :highlights='{"2": 2}')

  Slide
    h2 Register Beans
    .fw-row
      IconText(v-step="2" icon="at.png" text="@Bean methods")
      IconText(v-step="3" icon="scanner.png" text="Scan for @Component")

  Slide
    h2 @Bean methods
  Slide(title="@Bean methods · MetricsConfiguration.java")
    h2 @Bean methods
    Snippet(file="MetricsConfiguration.java" :highlights='{"4-7": 2, "9-13": 3}')
  Slide(title="@Bean methods · ObjectMapperConfiguration.java")
    h2 @Bean methods
    Snippet(file="ObjectMapperConfiguration.java" :highlights='{"4-11": 2}')

  Slide
    h2 Scan for @Component
  Slide(title="Scan for @Component · ComponentScanConfiguration.java")
    h2 Scan for @Component
    Snippet(file="ComponentScanConfiguration.java" :highlights='{"1": 2}')
  Slide(title="Scan for @Component · DefaultControllerAdvice.java")
    h2 Scan for @Component
    Snippet(file="DefaultControllerAdvice.java" :highlights='{"1": 2}')

  Slide(title="We have to register that configuration!!")
    p.fw-statement We have to register that configuration!!

  Slide
    h2 Register Configurations
  Slide(title="Register Configurations · ImportingConfiguration.java")
    h2 Register Configurations
    Snippet(file="ImportingConfiguration.java" :highlights='{1: 2, 2: 3}')

  Slide(title="We still need a configuration!!")
    p.fw-statement We still need a configuration!!

  Slide
    h2 Register Configurations
  Slide(title="Register Configurations · ApplicationImportingConfiguration.java")
    h2 Register Configurations
    Snippet(file="ApplicationImportingConfiguration.java" :highlights='{1: 2}')
  Slide(title="Register Configurations · ApplicationImportingConfiguration.java (2)")
    h2 Register Configurations
    Snippet(file="ApplicationImportingConfiguration2.java" name="ApplicationImportingConfiguration.java" :highlights='{"1-6": 2}')

  Slide(title="That is not exactly out-of-the-box...")
    p.fw-statement That is not exactly #[span.fw-nowrap out-of-the-box]...

  Slide
    h2 AutoConfigurations
  Slide(title="AutoConfigurations · MetricsAutoConfiguration.java")
    h2 AutoConfigurations
    Snippet(file="MetricsAutoConfiguration.java")
  Slide(title="AutoConfigurations · META-INF/spring.factories")
    h2 AutoConfigurations
    Snippet(file="spring.factories" name="META-INF/spring.factories" :highlights='{"1": 2, "2": 3}')
  Slide
    h2 AutoConfigurations: features
  Slide(title="AutoConfigurations: features · ReactiveAutoConfiguration.java")
    h2 AutoConfigurations: features
    Snippet(file="ReactiveAutoConfiguration.java" :highlights='{"1": 2}')
  Slide(title="AutoConfigurations: features · ObjectMapperAutoConfiguration.java")
    h2 AutoConfigurations: features
    Snippet(file="ObjectMapperAutoConfiguration.java" :highlights='{"1": 2, "6-14": 3, "2": 4, "2,6-14": 5}')

  Slide
    h2 Missing Features
    Cols(align="center" gap="sm")
      IconText(icon="logging.svg" text="Logging")
      IconText(icon="password.png" text="Obfuscation")
      IconText(icon="user.png" text="Session")

  Slide(title="Missing Features: Ingress / Egress")
    h2 Missing Features
    Cols(align="center" gap="sm")
      IconText(v-step="2" icon="enter.png" text="Ingress")
      IconText(v-step="3" icon="exit.png" text="Egress")

  Slide
    h2 Customize Ingress
  Slide(title="Customize Ingress · LoggingFilter.java")
    h2 Customize Ingress
    Snippet(file="LoggingFilter.java" :highlights='{"2:implements Filter": 2, "4-7": 2, "8-10": 3}')
  Slide(title="Customize Ingress · DebugFilter.java")
    h2 Customize Ingress
    Snippet(file="DebugFilter.java" :highlights='{"8-11": 2}')
  Slide(title="Customize Ingress · DebugWebFilter.java")
    h2 Customize Ingress
    Snippet(file="DebugWebFilter.java" :highlights='{"2:implements WebFilter": 2, "5-6": 2, "7-8": 3}')

  Slide
    h2 Customize Egress
  Slide(title="Customize Egress · LoggingInterceptor.java")
    h2 Customize Egress
    Snippet(file="LoggingInterceptor.java" :highlights='{"1:implements ClientHttpRequestInterceptor": 2, "4-6": 2, "7-10": 3}')
  Slide(title="Customize Egress · DebugInterceptor.java")
    h2 Customize Egress
    Snippet(file="DebugInterceptor.java" :highlights='{"8-11": 2}')
  Slide(title="Customize Egress · ApplicationService.java (RestTemplate)")
    h2 Customize Egress
    Snippet(file="ApplicationServletServiceWithInterceptor.java" name="ApplicationService.java" :highlights='{"6-11": 2, "8-9": 3}')
  Slide(title="Customize Egress · DebugFilterFunction.java")
    h2 Customize Egress
    Snippet(file="DebugFilterFunction.java" :highlights='{"1:implements ExchangeFilterFunction": 2, "4-5": 2, "6-9": 3}')
  Slide(title="Customize Egress · ApplicationService.java (WebClient)")
    h2 Customize Egress
    Snippet(file="ApplicationReactiveServiceWithInterceptor.java" name="ApplicationService.java" :highlights='{"6-11": 2, "9": 3}')

  Slide(title="That is not exactly out-of-the-box... (again)")
    p.fw-statement That is not exactly #[span.fw-nowrap out-of-the-box]...

  Slide
    h2 Modify Clients
  Slide(title="Modify Clients · RestTemplateCustomizer.java")
    h2 Modify Clients
    Snippet(file="RestTemplateCustomizer.java")
  Slide(title="Modify Clients · FrameworkRestTemplateCustomizer.java")
    h2 Modify Clients
    Snippet(file="FrameworkRestTemplateCustomizer.java" :highlights='{"4-8": 2}')
    Notes(step="2")
      p Every RestTemplate the application builds from RestTemplateBuilder gets these two interceptors: DebugInterceptor and LoggingInterceptor.
  Slide(title="Modify Clients · ApplicationServletService.java")
    h2 Modify Clients
    Snippet(file="ApplicationServletService.java" :highlights='{"6:final RestTemplateBuilder builder": 2, "7-8": 3}')
  Slide(title="Modify Clients · WebClientCustomizer.java")
    h2 Modify Clients
    Snippet(file="WebClientCustomizer.java")
  Slide(title="Modify Clients · FrameworkWebClientCustomizer.java")
    h2 Modify Clients
    Snippet(file="FrameworkWebClientCustomizer.java" :highlights='{"5-8": 2}')
  Slide(title="Modify Clients · ApplicationReactiveService.java")
    h2 Modify Clients
    Snippet(file="ApplicationReactiveService.java" :highlights='{"6:final WebClient.Builder builder": 2, "7-9": 3}')

  Slide(title="How to customize other classes?")
    p.fw-statement How to customize other classes?

  Slide
    h2 Modify Any Bean
  Slide(title="Modify Any Bean · BeanPostProcessor.java")
    h2 Modify Any Bean
    Snippet(file="BeanPostProcessor.java" :highlights='{"4-7": 2, "10-13": 3}')
    Notes
      p To do (my-slides): a note on the initializers, from the Spring bean lifecycle diagram.
    Notes(step="2")
      p #[code postProcessBeforeInitialization]: before the bean's initializers (#[code afterPropertiesSet], init-method).
    Notes(step="3")
      p #[code postProcessAfterInitialization]: after them.
  Slide(title="Modify Any Bean · PubSubTemplatePostProcessor.java")
    h2 Modify Any Bean
    Snippet(file="PubSubTemplatePostProcessor.java" :highlights='{"5-10": 2}')
    Notes
      p To do (my-slides): the differences between BeanPostProcessors and Customizers.
      p From these slides: a customizer reaches what its builder builds (RestTemplateBuilder, WebClient.Builder); a BeanPostProcessor sees every bean and may return another object, here a PubSubTemplateWrapper in place of the PubSubTemplate.

  //- ===== How to customize =====
  Slide(layout="section" bg="ekaterina-novitskaya-TU8bUiEr25c-unsplash.jpg" bg-opacity="0.2")
    h1 How to customize?
    Notes
      p Section time (times.txt): 10:15 · from 34:45 to 45:00.

  Slide
    h2 Configure Behaviour
    Cols(align="center" gap="sm")
      IconText(v-step="2" icon="properties.png" text="High-level")
      IconText(v-step="3" icon="java.png" text="Explicit")

  Slide
    h2 High-level Configuration
  Slide(title="High-level Configuration · application.properties")
    h2 High-level Configuration
    Snippet(file="application-framework.properties" name="application.properties")
  Slide(title="High-level Configuration · LoggingFilter.java")
    h2 High-level Configuration
    Snippet(file="LoggingFilterAtValue.java" name="LoggingFilter.java" :highlights='{"7-10": 2}')

  Slide(title="Is there a better mechanism?")
    p.fw-statement Is there a better mechanism?

  Slide(title="High-level Configuration · LoggingConfigurationProperties.java")
    h2 High-level Configuration
    Snippet(file="LoggingConfigurationProperties.java" :highlights='{"2": 2, "6,8": 3, "1,10-14": 4}')
  Slide(title="High-level Configuration · application.properties (2)")
    h2 High-level Configuration
    Snippet(file="application-framework.properties" name="application.properties" :highlights='{"1-2:log-request-body+++log-response-body": 2}')
  Slide(title="High-level Configuration · LoggingConfigurationProperties.java (2)")
    h2 High-level Configuration
    Snippet(file="LoggingConfigurationProperties.java" :highlights='{"6,8": 2}')
  Slide(title="High-level Configuration · ExampleConfigurationProperties.java")
    h2 High-level Configuration
    Snippet(file="ExampleConfigurationProperties.java" :highlights='{"5,6": 2}')
  Slide(title="High-level Configuration · application.properties (3)")
    h2 High-level Configuration
    Snippet(file="application-configuration-properties.properties" name="application.properties" :highlights='{"5-6": 2}')
  Slide(title="High-level Configuration · pom.xml")
    h2 High-level Configuration
    Snippet(file="configuration-processor.xml" name="pom.xml" :highlights='{"2-6": 2}')

  Slide
    h2 Explicit Configuration
  Slide(title="Explicit Configuration · RestTemplateCustomizer.java")
    h2 Explicit Configuration
    Snippet(file="RestTemplateCustomizer.java")
  Slide(title="Explicit Configuration · RestTemplateCustomizers.java")
    h2 Explicit Configuration
    Snippet(file="RestTemplateCustomizers.java" :highlights='{"3,7,11": 2, "4": 3, "12-13": 4}')
  Slide(title="Explicit Configuration · ApplicationService.java (RestTemplate)")
    h2 Explicit Configuration
    Snippet(file="ApplicationServletService.java" name="ApplicationService.java" :highlights='{"6-9": 2}')
  Slide(title="Explicit Configuration · ApplicationService.java (customizers)")
    h2 Explicit Configuration
    Snippet(file="ApplicationServletServiceWithCustomizers.java" name="ApplicationService.java" :highlights='{"8-9": 2}')
  Slide(title="Explicit Configuration · WebClient.java")
    h2 Explicit Configuration
    Snippet(file="RequestHeadersSpec.java" name="WebClient.java")
  Slide(title="Explicit Configuration · WebClientAttributes.java")
    h2 Explicit Configuration
    Snippet(file="WebClientAttributes.java" :highlights='{"7": 2, "8": 3}')
  Slide(title="Explicit Configuration · WebClientLoggingFilter.java")
    h2 Explicit Configuration
    Snippet(file="WebClientLoggingFilter.java" :highlights='{"8-11": 2}')
  Slide(title="Explicit Configuration · ApplicationService.java (WebClient)")
    h2 Explicit Configuration
    Snippet(file="ApplicationReactiveService.java" name="ApplicationService.java" :highlights='{"12-17": 2}')
  Slide(title="Explicit Configuration · ApplicationService.java (attributes)")
    h2 Explicit Configuration
    Snippet(file="ApplicationReactiveServiceWithAttributes.java" name="ApplicationService.java" :highlights='{"14-15": 2}')

  Slide
    h2 Extra: Replace Default Behaviour
  Slide(title="Extra: Replace Default Behaviour · MDCPropagatorAutoConfiguration.java")
    h2 Extra: Replace Default Behaviour
    Snippet(file="MDCPropagatorAutoConfiguration.java" :highlights='{"5-9": 2}')
  Slide(title="Extra: Replace Default Behaviour · MetricsAutoConfiguration.java")
    h2 Extra: Replace Default Behaviour
    Snippet(file="SensibleOrderAutoConfiguration.java" name="MetricsAutoConfiguration.java" :highlights='{"4": 2}')

  //- ===== Final touch =====
  Slide(layout="section" bg="pexels-shiva-smyth-1051449.jpg" bg-opacity="0.4")
    h1 Final touch
    Notes
      p Section time (times.txt): 1:30 · from 45:00 to 46:30.

  Slide(title="Quote: start.spring.io")
    Quote(author="Josh Long") Every good project starts at start.spring.io

  Slide(title="Quote: start.dev.travix.com")
    Quote(author="Travix Devs") Every good project starts at start.dev.travix.com

  Slide(title="Initializr (image)" bg="initializr.png")

  //- ===== Summary =====
  Slide(layout="section" bg="pexels-nandhu-kumar-312839.jpg" bg-opacity="0.4")
    h1 Summary
    Notes
      p Section time (times.txt): 1:30 · from 46:30 to 48:00.

  Slide
    h2 Summary
    .fw-summary
      p(v-step="2") Spring Boot provides #[strong(v-step.collapse="3") (almost)] everything we need
      p(v-step="4") We bundle all mechanisms our applications #[strong require in production]
      p(v-step="5") We provide #[strong company-specific] opinionated defaults
      p(v-step="6") We extend with custom behaviour as a last resort

  //- ===== Closing =====
  Slide(layout="section" bg="pexels-michael-judkins-1113552.jpg" bg-opacity="0.25" bg-position="0 -14em")
    h1 Live Demo
    Notes
      p Section time (times.txt): 7:00 · from 48:00 to 55:00.

  Slide(layout="cover" title="Building a Framework on top of Spring Boot (credits)")
    template(#background)
      Img.fw-title-bg(file="kelly-sikkema--BwtFJgaUho-unsplash.jpg" position="6em 0" opacity="0.47")
    TitleContent(credits)
</template>

<script setup>
import ProgressBar from '../addons/ProgressBar.vue'
import SlideNumber from '../addons/SlideNumber.vue'
import IconText from './framework/IconText.vue'
import Quote from './framework/Quote.vue'
import Social from './framework/Social.vue'
import TitleContent from './framework/TitleContent.vue'

// Production-readiness features; `category` is the step of the categories slide that
// highlights them (2 out-of-the-box, 3 need tweaking, 4 missing).
const readiness = [
  [
    { icon: 'serialization.svg', text: 'Serialization', category: 3 },
    { icon: 'error.png', text: 'Error', category: 3 },
    { icon: 'metrics.png', text: 'Metrics', category: 3 },
    { icon: 'logging.svg', text: 'Logging', category: 4 },
    { icon: 'password.png', text: 'Obfuscation', category: 4 },
  ],
  [
    { icon: 'tracing.svg', text: 'Tracing', category: 2 },
    { icon: 'user.png', text: 'Session', category: 4 },
    { icon: 'evaluate.png', text: 'Dependencies', category: 2 },
    { icon: 'lock.png', text: 'Exposure', category: 3 },
  ],
]

// Old calculateElementClass: nothing at step 1, then highlight the current category, dim the rest.
const mark = (step, category) => (step === 1 ? '' : step === category ? 'fw-hl' : 'fw-dim')
</script>

<style scoped>
/* the title photo is clipped to a diagonal band on the right */
.fw-title-bg { clip-path: polygon(66% 0, 100% 0, 100% 100%, 33% 100%); }

/* the forbidden sign is placed over the StackOverflow icon */
.fw-stack { position: relative; }

/* old ".flex.center.even": items side by side, equal columns, centred. Most icon rows use
   Cols(align="center" gap="sm"); this stays where a label is wider than an equal column:
   here the column grows to fit it (Cols keeps columns equal, so the label would wrap), and
   for the rows of .fw-rows, which spreads them evenly (Rows makes equal rows). */
.fw-row {
  flex: 1; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(max-content, 1fr);
  column-gap: .6em; align-items: center; justify-items: center;
}
.fw-rows { flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; }
.fw-rows .fw-row { flex: none; }

.fw-dim { opacity: .15; }
.fw-hl { color: var(--ph-accent); }

/* old FullTextSlide: a centred, bold, uppercase statement */
.fw-statement {
  margin: auto 0 !important; /* centred vertically inside the slide's flex column */
  font-size: var(--ph-title); font-weight: 700; line-height: 1.15;
  text-align: center; text-transform: uppercase;
}
.fw-nowrap { white-space: nowrap; }

.fw-issues {
  flex: 1; display: grid; grid-template-columns: 1fr 1fr; align-content: space-evenly;
  column-gap: 2em; padding: 0 1em;
}
.fw-issues > :nth-child(even) { margin-top: 2.2rem; }

.fw-forbidden { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); width: 21em; height: 21em; max-width: 100%; max-height: 100%; }
.fw-forbidden.ph-img-missing { align-items: flex-start; justify-content: flex-end; }

.fw-summary { flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; font-size: 1.5em; }
.fw-summary p { margin: 0; }

/* About me: page split at 72%, accent panel on the right, round picture on the seam */
.fw-about { flex: 1; display: flex; align-items: center; }
.fw-about-panel { position: absolute; top: 0; right: 0; bottom: 0; width: 28%; background: var(--ph-accent); }
.fw-about-pic { position: absolute; left: calc(72% - 8em); top: calc(50% - 8em); z-index: 1; width: 16em; height: 16em; background: var(--ph-bg); }
/* the old crop: the whole photo (contained), moved 5 % right and zoomed 1.65× on the face */
.fw-about-pic :deep(img) { transform: translate(5%, -.5%) scale(1.65); }
.fw-about-info { position: relative; width: calc(72% - 8em - 160px); display: flex; flex-direction: column; }
.fw-about-name { font-size: 2.1em; font-weight: 700; text-align: center; margin-bottom: .3em !important; }
.fw-about-role { font-size: 1.3em; color: var(--ph-muted); text-align: center; }
.fw-about-social { font-size: 1.4em; margin: 2.5em 0 0 1em; }
.fw-about-social p { margin: 0 0 .3em; }
</style>
