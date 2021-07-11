import { PDFdocument } from "./components/PDFdocument";
import JSZip, { JSZipObject } from "jszip";
import { eventHub as ToolEvents } from "./components/Tools/Tool";
import { Database } from "./Db";
import Vue from "vue";
import FileSaver from "file-saver";

export const eventHub = new Vue();

eventHub.$on('setDocument', setPdf);
eventHub.$on('parseDocuments', readZip);
eventHub.$on('downloadZip', createZip);

export let Documents: Document[] = []
let pdf: null | PDFdocument = null;
let selectedDocumentIndex = 0;
async function setPdf(index: number) {
    if (index < 0 || index >= Documents.length) return;
    if (index == selectedDocumentIndex) return;

    selectedDocumentIndex = index;
    var data = Documents[index];
    if (pdf?.pageCanvases) {
        pdf.pageCanvases.forEach((e) => e.dispose());
    }
    pdf = new PDFdocument(data.initialPdf, data.id);

    eventHub.$emit('documentChanged', pdf, Documents[index]);
}

export function getViewedDocument() { return pdf }


export async function readZip(file: File) {
    const metaDatas: Document[] = []
    const buffer = await file.arrayBuffer();
    const zipReader = new JSZip();
    const zipFile = await zipReader.loadAsync(buffer);
    let index = 0;
    zipFile.forEach(async (path, entry) => {
        if (!entry.name.endsWith('.pdf')) return;
        const data = await entry.async('arraybuffer');
        index++;
        const splittedName = entry.name.split('/')[1].split('-');
        metaDatas.push({
            pdfData: data,
            initialPdf: data,
            index: index,
            kategoria: splittedName[1],
            riesitel: splittedName[2] + ' ' + splittedName[3],
            id: parseInt(splittedName[splittedName.length - 1].substring(0, 4)),
            changes: [],
            originalName: entry.name,
        });
        Database.addDocument(metaDatas[metaDatas.length - 1]);
    });
    Documents = metaDatas;
}

export async function loadFromDatabase() {
    const metaDatas: Document[] = []
    const docs = await Database.getAllDocuments();
    docs.forEach(e => {
        metaDatas.push(e);
    })
    metaDatas.sort((a: Document, b: Document) => a.index - b.index);
    Documents = metaDatas;
    return metaDatas;
}

async function createZip() {
    const documents = await loadFromDatabase();
    const zip = new JSZip();
    const pts: Record<string, number> = {};
    for (const doc of documents) {
        zip.file(doc.originalName, doc.pdfData);
        pts[doc.id] = doc.hodnotenie?.body || 0;
    }
    zip.file('/points.json', JSON.stringify(pts));
    const data = await zip.generateAsync({ type: "blob" });
    const file = new File([data], 'Opravene.zip');
    FileSaver.saveAs(file);
}


export interface Document {
    riesitel: string;
    kategoria: string;
    index: number;
    id: number;
    hodnotenie?: {
        body: number;
        splnene: boolean[];
        final: boolean;
    }
    pdfData: ArrayBuffer;
    initialPdf: ArrayBuffer;
    changes: any[];
    originalName: string;
}