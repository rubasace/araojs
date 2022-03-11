import Eagle from 'eagle.js'
import BaseSlideContent from '../components/BaseSlideContent'
import CustomCodeBlock from '../components/CustomCodeBlock'
import FitText from '../components/FitText'
import ImagesPreloader from '../components/ImagesPreloader'
import Quote from '../components/Quote'
import SectionTitle from '../components/SectionTitle'
import Snippet from '../components/Snippet'
import TextWithIcon from '../components/TextWithIcon'
import TransparentBackground from '../components/TransparentBackground'
import BaseSlide from '../slides/BaseSlide'
import FullImageSlide from '../slides/FullImageSlide'
import FullSlide from '../slides/FullSlide'
import FullTextSlide from '../slides/FullTextSlide'
import SnippetSlide from '../slides/SnippetSlide'

export default {
    install(Vue){
        Vue.use(Eagle)

        Vue.component('BaseSlideContent', BaseSlideContent);
        Vue.component('CustomCodeBlock', CustomCodeBlock);
        Vue.component('FitText', FitText);
        Vue.component('ImagesPreloader', ImagesPreloader);
        Vue.component('Quote', Quote);
        Vue.component('SectionTitle', SectionTitle);
        Vue.component('Snippet', Snippet);
        Vue.component('TextWithIcon', TextWithIcon);
        Vue.component('TransparentBackground', TransparentBackground);
        Vue.component('BaseSlide', BaseSlide);
        Vue.component('FullImageSlide', FullImageSlide);
        Vue.component('FullSlide', FullSlide);
        Vue.component('FullTextSlide', FullTextSlide);
        Vue.component('SnippetSlide', SnippetSlide);

        Vue.directive('visible', function(el, binding) {
            el.style.visibility = binding.value ? 'visible' : 'hidden';
        });
        document.body.classList.add('nocursor');
        let timeoutId;
        document.addEventListener('mousemove', e => {
            document.body.classList.remove('nocursor');
            if(timeoutId){
                clearTimeout(timeoutId)
            }
            timeoutId = setTimeout(() => document.body.classList.add('nocursor'), 4000);
        });
    }
}