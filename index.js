import { Consts } from './consts'
import { EventEmitter } from 'events'
import * as _ from 'lodash-es/lang'
import _extend from 'lodash-es/extend'

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
            this.selectedClass = options.selectedClass || Consts.ClassNames.RECT_SELECTED
            this.frameSize = options.frameSize
        }

        // init
        this._init()
    }

    render() {
        this._createMaskLayer()
        this._renderRects(this.data)
    }

    reRender() {
        this.clean();
        this._init();
        this.render();
    }

    clean() {
        for (let i = 0; i < this.rects.length; i++) {
            this.rects[i].remove()
        }

        this.rects = []
    }

    _renderRects(root) {
        // this.data should be the root element or an array of elements
        if (_.isArray(root)) {
            for (let i = 0; i < root.length; i++) {
                this._renderRects(root[i]);
            }
        } else if (_.isObject(root)) {
            this._createRectOnMaskLayer({ rect: root, layerSize: this, frameSize: this.frameSize })
            if (root.children) {
                for (let i = 0; i < root.children.length; i++) {
                    this._renderRects(root.children[i])
                }
            }
        }
    }

    _createMaskLayer() {
        let mask = document.createElement('div')
        mask.setAttribute('style', 'width:100%;height:100%;left:0;right:0;top:0;bottom:0;position:absolute')
        mask.setAttribute('class', Consts.ClassNames.MASK);
        this.container.appendChild(mask)
        this.mask = mask
        this.frameSize = this.frameSize || { width: this.mask.offsetWidth, height: this.mask.offsetHeight }
    }

    _init() {
        this.sourceElement = document.querySelector(this.sourceElementSelector)
        //this.targetElement = document.querySelector(this.targetElementSelector)

        this.width = this.sourceElement.offsetWidth
        this.height = this.sourceElement.offsetHeight

        this.container = this.sourceElement.parentElement
        this.rects = []
        this.selectedRect = {}
        this.selectedRealRect = {}
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
            realRect = _extend({}, rect)
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
        styleStr += 'box-sizing: border-box;'
        rectEl.setAttribute('style', styleStr)
        rectEl.setAttribute('class', this.standByClass)
        rectEl.addEventListener('mouseover', () => {
            if (this.selectedRect != rectEl) {
                rectEl.setAttribute('class', this.activedClass)
            }
            this.emit(Consts.Events.RECT_ACTIVED, realRect)
        })
        rectEl.addEventListener('mouseout', () => {
            if (this.selectedRect != rectEl) {
                rectEl.setAttribute('class', this.standByClass)
            }
            this.emit(Consts.Events.RECT_DISACTIVED, realRect)
        })
        rectEl.addEventListener('click', () => {
            if (this.selectedRect != rectEl) {
                if (_.isFunction(this.selectedRect.setAttribute)) {
                    // unselect previous one
                    this.selectedRect.setAttribute('class', this.standByClass)
                    this.emit(Consts.Events.RECT_UNSELECTED, this.selectedRealRect)
                }
                this.selectedRect = rectEl
                this.selectedRealRect = realRect
                rectEl.setAttribute('class', this.selectedClass)
                this.emit(Consts.Events.RECT_SELECTED, realRect)
            } else {
                // unselect it
                this.selectedRect = {}
                rectEl.setAttribute('class', this.standByClass)
                this.emit(Consts.Events.RECT_UNSELECTED, realRect)
            }
        })

        this.container.appendChild(rectEl)
        this.rects.push(rectEl)
    }
}
