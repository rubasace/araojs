<template lang="pug">
  .flex.vertical.full-height.center
    .code-window.shadowbox
      .code-header(:style='cssProps')
        span {{fileName}}
      .code-content.full
        CustomCodeBlock(:lang='language' :id='snippetId')
          div(v-html='codeSnippet').full.code-div


</template>

<script>
// TODO add targetStep and take it into consideration for processedHighlights
// TODO make fit work on change of size
// TODO resize automatically?
// TODO load json files as String and not as Object
// TODO fix line numbers width not being always the same (ObjectMapperConfiguration vs DefaultControllerAdvice)
// TODO fix separator not always properly placed (LoggingInterceptor)


import CustomCodeBlock from "./CustomCodeBlock";

export default {
  components: {
    CustomCodeBlock
  },
  props: {
    snippetId: {default: () => Math.random().toString(36).substr(2, 10)},
    hideHighlightsGoingBack: {
      type: Boolean,
      default: false
    },
    hideLineNumbers: {
      type: Boolean,
      default: false
    },
    textDelimiter: {
      type: String,
      default: '+++'
    },
    lang: String,
    file: {
      type: String,
      required: true
    },
    name: String,
    comments: {
      type: Object,
      default: function () {
        return {}
      }
    },
    highlights: {
      type: Object,
      default: function () {
        return {}
      }
    },
  },
  data() {
    return {
      stringContent: "",
      processedSnippet: "",
      cssProps: {
        backgroundImage: `url(${require('../assets/icons/code-buttons.svg')})`
      }
    }
  },
  created() {
    import("!!raw-loader!@/assets/snippets/" + this.file).then(content => this.processContent(content))
  },
  methods: {
    processContent(content) {
      this.stringContent = typeof content.default !== "object" ? content.default : JSON.stringify(content.default, null, 4)
      this.processedSnippet = this.stringContent.split('\n')
          .map((line, index) => this.lineToTag(line, index, false))
          .join('\n');
    },
    commentVisible(index) {
      let comment = this.comments[index + 1];
      return comment && (comment.active === undefined || comment.active) && (comment.showGoingBack || this.parentSlide === undefined || this.parentSlide.direction === 'next')
    },
    isHighlightActive(highlight, step) {
      if (highlight === undefined || !(!this.hideHighlightsGoingBack || this.parentSlide === undefined || this.parentSlide.direction === 'next')) {
        return false;
      }
      if (!isNaN(highlight)) {
        return highlight === step;
      }
      return highlight.active === undefined || highlight.active
    },
    escapeContent(content) {
      const div = document.createElement('div');
      div.textContent = content;
      return div.innerHTML;
    },
    createLineNumberSpan(index, extraClass) {
      if (this.hideLineNumbers) {
        return '';
      }
      const separator = index === 0 ? '<span class="separator"></span>' : '';
      return `<span class="snippet-code line-number nohighlight ${extraClass}">${index + 1}</span>${separator}`;
    },
    lineToTag(line, index, highlight) {

      if (!highlight || !this.highlightedLines.length) {
        return `${this.createLineNumberSpan(index)}<span class='snippet-line'><span>${this.escapeContent(line)}</span></span>`;
      }
      const currentHighlight = this.highlightedLines.filter(e => e.active && (e.lines === undefined || e.lines.includes(index + 1)))[0];
      if (!currentHighlight) {
        return `${this.createLineNumberSpan(index, 'dimmed')}<span class='snippet-line'><span class='snippet-code dimmed'>${this.escapeContent(line)}</span></span>`
      }
      if (!currentHighlight.words) {
        return `${this.createLineNumberSpan(index, 'highlighted')}<span class='snippet-line'><span class='snippet-code highlighted'>${this.escapeContent(line)}</span></span>`
      }
      const wordsArray = currentHighlight.words.split(this.textDelimiter);
      //TODO solve this with one replaceAll with groups
      const sanitizedWords = currentHighlight.words.replaceAll('|', '\\|').replaceAll('(', '\\(').replaceAll(')', '\\)')
      const wordsRegex = `(${sanitizedWords.replaceAll(this.textDelimiter, '|')})`;
      const lineContent = line.split(new RegExp(wordsRegex))
          .filter(e => e.length)
          .map(e => `<span class='snippet-code ${wordsArray.includes(e) ? "highlighted" : "dimmed"}'>${this.escapeContent(e)}</span>`)
          .join('');
      return `${this.createLineNumberSpan(index, 'dimmed')}<span class='snippet-line'>${lineContent}</span>`
    },
    processRange(range) {
      if (!range) {
        return undefined;
      }
      return range.split(',').flatMap(e => this.processInterval(e));
    },
    processInterval(interval) {
      const parts = interval.split('-');
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return this.range(parts[0], parts[1]);
      }
      return [Number.parseInt(interval)];
    },
    processWords(words) {
      if (!words) {
        return undefined;
      }
      return words.split(this.textDelimiter);
    },
    range(a, b) {
      const aValue = Number.parseInt(a);
      const bValue = Number.parseInt(b);
      let start;
      let end;
      if (aValue < bValue) {
        start = aValue;
        end = bValue;
      } else {
        start = bValue;
        end = aValue;
      }
      return [...Array(end - start + 1).keys()].map(i => i + start);
    },
  },
  computed: {
    language() {
      return this.lang ? this.lang : this.file.split('.').slice(-1)[0];
    },
    codeSnippet() {
      if(this.parentSlide.step == 1){
        return this.processedSnippet
      }
      return this.stringContent.split('\n')
          .map((line, index) => this.lineToTag(line, index, true))
          .join('\n');
    },
    parentSlide() {
      let parent = this.$parent;
      while (parent !== undefined) {
        if (parent.isSlide) {
          return parent;
        }
        parent = parent.$parent;
      }

      return undefined;
    },
    fileName() {
      return this.name ?? this.file.split('/').slice(-1)[0]
    },
    processedHighlights() {
      const processedHighlights = [];
      for (let i = 0; i < Object.keys(this.highlights).length; i++) {
        const key = Object.keys(this.highlights)[i];
        const processedHighlight = {};
        const parts = key.split(':');
        processedHighlight.lines = this.processRange(parts[0]);
        processedHighlight.words = parts[1];
        processedHighlight.active = this.isHighlightActive(this.highlights[key], this.parentSlide.step);
        processedHighlights.push(processedHighlight);
      }
      return processedHighlights;
    },
    highlightedLines() {
      return this.processedHighlights.filter(e => e.active);
    },
    requiredSteps() {
      return Math.max(1, ...Object.values(this.highlights));
    }

  }
}
</script>
<style scoped lang="sass">
.code-window
  display: flex
  flex-direction: column
  margin: 0 auto
  height: 90%
  width: 80%
  border-radius: 0.5em
  overflow: hidden

  .code-header
    background-repeat: no-repeat
    background-size: 4.3em
    background-position-x: 0.5em
    background-position-y: center
    text-align: center
    flex-shrink: 0
    font-size: 1em
    padding: 0.3em 0

  .code-content
    width: 100%
    margin: 0
    padding: 0
    text-align: left
    position: relative
    flex: 1 0 auto
    height: 0

    ::v-deep div
      width: 100%
      height: 100%
      box-sizing: border-box

    ::v-deep pre,
    ::v-deep code
      padding: 0
      box-sizing: border-box
      margin: 0
      width: 100%
      height: 100%

$lineColor: #686868
$boxVerticalPadding: 0.5em
::v-deep .separator
  position: absolute
  //height: 100%
  top: $boxVerticalPadding
  bottom: $boxVerticalPadding
  border-right: solid 2px $lineColor

::v-deep .code-div
  padding-top: $boxVerticalPadding
  padding-bottom: $boxVerticalPadding
  padding-left: 0
  padding-right: $boxVerticalPadding

::v-deep .language-java
  //workaround while we don't fix Java on PrismJs
  color: #fd9170

::v-deep .snippet-line
  margin-left: 0.5em

::v-deep .snippet-code
  &.dimmed
    opacity: 0.15

  &.highlighted
    filter: brightness(120%) saturate(140%)

  &.line-number
    text-align: right
    width: 4%
    margin-right: 1%
    margin-left: 1%
    display: inline-block
    color: lighten($lineColor, 35%) !important

    .hljs-number
      color: lighten($lineColor, 35%) !important

    code-content
      .eg-code-block.container
        width: 100% !important

        .code-box
          width: 100% !important

      span
        width: 100%
        height: 1em
        text-align: left

</style>