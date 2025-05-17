<template>
    <div class="container q-pa-md">
        <div class="imgs flex row q-mb-md">
            <div class="image-frame" ref="imageFrameRef">
                <q-img v-if="imageUrl" :src="imageUrl" class="image" spinner-color="primary" :ratio="null" fit="contain"
                    ref="inputImgRef" />
                <span v-else class="placeholder text-grey">Image will appear here</span>
            </div>
            <div class="image-frame q-ml-md" ref="resultImageFrameRef" v-if="useOpenCV">
                <q-img v-if="resultImageUrl" :src="`${resultImageUrl}?t=${cacheKey}`" class="image"
                    ref="resultImgRef"
                    spinner-color="primary" :ratio="null" fit="contain" @error="handleImageError" />
                <span v-else class="placeholder text-grey">Result image will appear here</span>
            </div>
        </div>


        <div class="info-panel">
            <div v-if="uploadMessage" class="q-mb-sm">
                <q-banner dense>{{ uploadMessage }}</q-banner>
            </div>
            <div v-if="uploadedFilename" class="q-mb-sm">
                <q-banner dense>Filename: {{ uploadedFilename }}</q-banner>
            </div>
            <div v-if="zoiInfo && zoiInfo.length">
                <div v-for="(disk, idx) in zoiInfo" :key="idx" class="zoi-disk q-mb-sm">
                    <div><strong>Disk {{ idx + 1 }}</strong></div>
                    <div v-if="disk.center_x !== undefined && disk.center_y !== undefined">
                        X: {{ disk.center_x.toFixed(2) }} px, Y: {{ disk.center_y.toFixed(2) }} px
                    </div>
                    <div>Diameter: {{ disk.diameter_mm.toFixed(2) }} mm</div>
                </div>
            </div>
            <div v-else class="placeholder text-grey">
                No ZoI info yet.
            </div>
        </div>
        <div class="file-uploader q-mt-md">
            <q-file filled label="Select an image" accept="image/*" v-model="file" />
        </div>
        <div class="controls">
            <q-btn class="q-mt-md" :loading="uploading" label="Upload" color="primary" @click="uploadFile" :disabled="!file" />
            <q-btn class="q-mt-md q-ml-sm" label="Clear" color="negative" @click="clearFile" />
            <q-toggle class="q-mt-md q-ml-sm" label="Use OpenCV (very experimental)" v-model="useOpenCV">
                <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 10]" transition-show="scale"
                    transition-hide="scale" transition-duration="200"
                    :style="{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }">
                    <span class="text-white">Use OpenCV to detect ZoI, otherwise load from csv.<br>This function is very experimental and not
                        working properly currently.</span>
                </q-tooltip>
            </q-toggle>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import useMainStore from '../stores/main.store'
import { useQuasar } from 'quasar'

// variables

const $q = useQuasar()

const file = ref(null)
const imageUrl = ref(null)
const resultImageUrl = ref(null)
const zoiInfo = ref([])
const uploadMessage = ref('')
const uploadedFilename = ref('')
const inputImgRef = ref(null)
const resultImgRef = ref(null)
const checkZoiResult = ref(null)

const useOpenCV = ref(false)

// strictly for result image cache
const cacheKey  = ref(Date.now())

const mainStore = useMainStore()

// methods

const clearFile = () => {
    file.value = null
    imageUrl.value = null
    zoiInfo.value = []
    uploadMessage.value = ''
    uploadedFilename.value = ''
    resultImageUrl.value = null
}

const uploadFile = async () => {
    if (!file.value) return
    resultImageUrl.value = null
    cacheKey.value = Date.now()
    try {
        checkZoiResult.value = await mainStore.uploadZoIimage(file.value)
        // set values from request, if any is not present, set default
        if (checkZoiResult.value) {
            uploadMessage.value = checkZoiResult.value.message || ''
            uploadedFilename.value = checkZoiResult.value.filename || ''
            zoiInfo.value = checkZoiResult.value.zoi || []
            
            // Set the result image URL directly from response
            if (checkZoiResult.value.imageUrl) {
                resultImageUrl.value = checkZoiResult.value.imageUrl
                cacheKey.value = Date.now()
            } else {
                resultImageUrl.value = null;
            }
        }
    } catch (error) {
        // if there is no data for the image, show a warning
        if (error.response && error.response.status === 404) {
            $q.notify({
                type: 'warning',
                message: 'No information for this image'
            })
        } else {
            console.error('Error checking ZoI:', error)
        }
    }
}

// computed
const uploading = computed(() => {
    return mainStore.uploadStatus === 'uploading'
})

// image error handling
const handleImageError = (event) => {
    console.error("Failed to load image:", event)
    $q.notify({
        type: 'negative',
        message: 'Failed to load result image'
    });
}

// watch
watch(file, (val) => {
    if (val && val instanceof File) {
        imageUrl.value = URL.createObjectURL(val)
        zoiInfo.value = []
        uploadMessage.value = ''
        uploadedFilename.value = ''
    } else {
        imageUrl.value = null
        zoiInfo.value = []
        uploadMessage.value = ''
        uploadedFilename.value = ''
    }
})

watch(useOpenCV, (val) => {
    if (val) {
        mainStore.setUseOpenCV(true)
    } else {
        mainStore.setUseOpenCV(false)

    }
})


</script>

<style scoped lang="scss">
.container {
    display: flex;
    flex-direction: column;
}

.image-frame {
    width: 300px;
    height: 200px;
    border: 1px dashed #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.image {
    max-width: 100%;
    max-height: 100%;
    display: block;
}

.placeholder {
    color: #aaa;
}

.file-uploader {
    width: 100%;
    max-width: 200px;
}
</style>