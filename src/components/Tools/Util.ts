import {PDFdocument} from "@/components/PDFdocument";
import {Util} from "@/@types";
import {Annotation} from "@/Annotation";
import store from '@/Store';

/*
   TODO:
    - copying to different page
 */

export const utils: Util[] = [
    <Util>{
        name: 'copy',
        icon: 'content_copy',
        tooltip: 'Kopírovať',
        shortcut: 'ctrl+c',
        style: 'primary',
        use(pdf: PDFdocument, page: number) {
            const selected = pdf?.pageCanvases[page]?.getActiveObjects();
            console.log(selected);
            if (selected == null  || selected.length === 0) return;
            const annotations: Annotation[] = [];
            selected.forEach(obj => {
                let found = false;
                for(const annot of pdf.annotations) {
                    if(obj.name === annot.object.name) {
                        annotations.push(annot);
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    console.error(`Could not find annotation with name ${obj.name}`);
                }
            });
            /*  TODO: multiple object copy paste
                I need to figure out how to get real object coordinates when multiple are selected
             */
            pdf.pageCanvases[page].discardActiveObject();
            store.commit('Clipboard/set', annotations);
            console.log(annotations.length);
            return annotations;
        }
    },
    <Util>{
        name: 'paste',
        icon: 'content_paste',
        tooltip: 'Prilepiť',
        shortcut: 'ctrl+v',
        style: 'primary',
        use(pdf: PDFdocument, page: number, useMouse: boolean = false) {
            store.dispatch('Clipboard/paste', {
                useMouse,
                pdf,
                page
            });
        }
    },
    <Util>{
        name: 'cut',
        icon: 'content_cut',
        tooltip: 'Vystrihnúť',
        shortcut: 'ctrl+x',
        style: 'danger',
        use(pdf: PDFdocument, page: number) {
            const objects = utils[0].use(pdf, page);
            if(objects) {
                for (const obj of objects) {
                    obj.delete();
                }
            }
        }
    }
];

// const X_OFFSET = 10;
// const Y_OFFSET = 10;

// function pasteObject(pdf: PDFdocument, page: number, obj: ClipboardObject) {
//     const canvas = pdf.pageCanvases[obj.page];
//     console.log(obj);
//     canvas.discardActiveObject();
//     switch(obj.type) {
//         case 'Sign':
//             // TODO: Pasting signature throws duplicate ID error
//             // @ts-ignore
//             obj.data.left += X_OFFSET; obj.data.top += Y_OFFSET;
//             break;
//         case 'Rect':
//         case 'Ellipse':
//         case 'Text':
//             // @ts-ignore
//             obj.data.left += X_OFFSET; obj.data.top += Y_OFFSET;
//             break;
//         case 'Line':
//             // @ts-ignore
//             obj.data.x1 += X_OFFSET; obj.data.y1 += Y_OFFSET; obj.data.x2 += X_OFFSET; obj.data.y2 += Y_OFFSET;
//             break;
//     }
//     const annot = getAnnotation(obj, canvas);
//     console.log(annot);
//     pdf.addAnnotation(annot);

//     canvas.setActiveObject(annot.object);
//     canvas.requestRenderAll();
//     return obj;
// }

// function getAnnotation(obj: ClipboardObject, canvas: Canvas): Annotation {
//     switch (obj.type) {
//         case 'Rect':
//             return new RectAnnotation(obj.page, obj.data, canvas);
//         case 'Ellipse':
//             return new EllipseAnnotation(obj.page, obj.data, canvas);
//         case 'Line':
//             return new LineAnnotation(obj.page, obj.data, canvas);
//         case 'Text':
//             return new TextAnnotation(obj.page, obj.data, canvas);
//         case 'Image':
//             return new ImageAnnotation(obj.page, obj.data, canvas);
//         case 'Path':
//             return new PathAnnotation(obj.page, obj.data as { path: string, options: fabric.IPathOptions }, canvas);
//         case 'Sign':
//             return new SignAnnotation(obj.page, obj.data, canvas);
//         default:
//             throw new Error('Unknown annotation type');
//     }
// }
