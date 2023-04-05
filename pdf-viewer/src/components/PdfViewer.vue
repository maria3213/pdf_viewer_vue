<template>
    <div class="root">
      <h2>PDF file list</h2>
      <div class="list-container">
        <div v-for="file in fileList" :key="file.path" class="file-list">
           <div  @click="onClickFile(file)" v-if="!file.children">{{ file.label }}</div>
           <el-tree :data="[file]" :props="defaultProps" @node-click="onClickFile" v-else/>
        </div>
      </div>
      <el-dialog v-model="pages" width="700px" :style="{ 'margin-top': '10px' }" center>
        <el-carousel indicator-position="outside" :autoplay="false" height="800px" padding="5px">
          <el-carousel-item v-for="item in pages" :key="item">
              <canvas :ref="setRef(item)" class="canvas"></canvas>
          </el-carousel-item>
      </el-carousel>
  </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

  const fileList = ref([])
  const pdfCanvas = ref([])
  const pages = ref(0)
  const defaultProps = {
    children: 'children',
    label: 'label',
  }
 
  function setRef(index) {
      return (el) => {
        pdfCanvas.value[index] = el
      }
  }
  
  function openFile(file) {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = async () => {
      const pdfData = new Uint8Array(reader.result)
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise
      const numPages = pdfDoc.numPages
      pages.value = numPages;
      const pagePromises = []
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        const canvas = pdfCanvas.value[i];
        canvas.height = viewport.height
        canvas.width = viewport.width
        const context = canvas.getContext('2d')
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        pagePromises.push(page.render(renderContext).promise)
      }
      await Promise.all(pagePromises)
    }
  }

  async function onClickFile(fileInfo) {
    if(Array.isArray(fileInfo.children)){
      return;
    }
    const response = await fetch(`/pdf/${encodeURIComponent(fileInfo.path)}`);
    const res = await response.blob()
    openFile(res);
  }

  onMounted(async () => {
    try {
      // set path to Web Worker
      pdfjsLib.GlobalWorkerOptions.workerSrc ='../../node_modules/pdfjs-dist/legacy/build/pdf.worker.js';
      const response = await fetch('/pdfs');
      if (!response.ok) {
        throw new Error('Could not retrieve PDFs');
      }
      const data = await response.json();
      fileList.value = data;
    } catch (err) {
      console.error(err);
    }
  });
  </script>

<style scoped>
  .root {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.25);
  }
  .root > h2 {
    color: #fff;
    margin-bottom: 50px;
  }
  .list-container{
    border:10px solid #fff;
    border-radius: 10px;
  }
  .file-list {
    width:140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    /* margin-left: 10px; */
  }
  .file-list > div {
    font-size: 14px;
    color: rgb(96, 98, 102);
    background-color: #fff;
    padding: 10px;
    text-align: center;
  }

  .file-list > div:hover {
    cursor: pointer;
  }

  .canvas {
    /* width: 80%; */
    height: 100%;
    margin-left: 20px;
  }
</style>