import { Consts } from './consts'
import { EventEmitter } from 'events'

export class CanvasHighlighter extends EventEmitter {

    constructor(options) {
        super()
        // params handling
        if (options) {
            this.sourceElementSelector = options.sourceElement
            //this.targetElementSelector = options.targetElement
            this.data = options.data
            this.standByClass = options.standByClass || Consts.ClassNames.RECT_STAND_BY
            this.activedClass = options.activedClass || Consts.ClassNames.RECT_ACTIVED
        }

        // init
        this._init()
    }

    render() {
        this._createMaskLayer()
        this._renderRects(this.data)
    }

    _renderRects(root) {
        // this.data should be the root element
        this._createRectOnMaskLayer({ rect: root, layerSize: this, frameSize: { width: this.mask.offsetWidth, height: this.mask.offsetHeight }})
        if (root.children) {
            for (let i = 0; i < root.children.length; i++) {
                this._renderRects(root.children[i])
            }
        }
    }

    _createMaskLayer() {
        let mask = document.createElement('div')
        mask.setAttribute('style', 'width:100%;height:100%;left:0;right:0;top:0;bottom:0;position:absolute')
        mask.setAttribute('class', Consts.ClassNames.MASK);
        this.container.appendChild(mask)
        this.mask = mask
    }

    _init() {
        this.sourceElement = document.querySelector(this.sourceElementSelector)
        //this.targetElement = document.querySelector(this.targetElementSelector)

        this.width = this.sourceElement.offsetWidth
        this.height = this.sourceElement.offsetHeight

        this.container = this.sourceElement.parentElement
    }

    _createRectOnMaskLayer(options) {
        let rect, layerSize, frameSize;
        if (options) {
            rect = options.rect || { left: 0, top: 0, right: 0, bottom: 0 }
            layerSize = options.layerSize || { width: 100, height: 100 }
            frameSize = options.frameSize || { width: 100, height: 100 }
        }

        let realRect = rect
        if (!(layerSize.width === frameSize.width && layerSize.height === frameSize.height)) {
            realRect = {}
            realRect.left = rect.left == undefined ? undefined : (rect.left * layerSize.width / frameSize.width)
            realRect.right = rect.right == undefined ? undefined : (rect.right * layerSize.width / frameSize.width)
            realRect.top = rect.top == undefined ? undefined : (rect.top * layerSize.height / frameSize.height)
            realRect.bottom = rect.bottom == undefined ? undefined : (rect.bottom * layerSize.height / frameSize.height)
            realRect.width = rect.width == undefined ? undefined : (rect.width * layerSize.width / frameSize.width)
            realRect.height = rect.height == undefined ? undefined : (rect.height * layerSize.height / frameSize.height)
        }
        let rectEl = document.createElement('div')
        let styleStr = 'position:absolute;'
        if (realRect.left != undefined) {
            styleStr += `left:${realRect.left};`
        }
        if (realRect.right != undefined) {
            styleStr += `right:${realRect.right};`
        }
        if (realRect.top != undefined) {
            styleStr += `top:${realRect.top};`
        }
        if (realRect.bottom != undefined) {
            styleStr += `bottom:${realRect.bottom};`
        }
        if (realRect.width != undefined) {
            styleStr += `width:${realRect.width};`
        }
        if (realRect.height != undefined) {
            styleStr += `height:${realRect.height};`
        }
        rectEl.setAttribute('style', styleStr)
        rectEl.setAttribute('class', this.standByClass)
        rectEl.addEventListener('mouseover', () => {
            rectEl.setAttribute('class', this.activedClass)
            this.emit(Consts.Events.RECT_ACTIVED, realRect)
        })
        rectEl.addEventListener('mouseout', () => {
            rectEl.setAttribute('class', this.standByClass)
            this.emit(Consts.Events.RECT_DISACTIVED, realRect)
        })

        this.container.appendChild(rectEl)
    }
}