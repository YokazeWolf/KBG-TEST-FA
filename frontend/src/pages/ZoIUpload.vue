<template>
    <div class="container q-pa-md">
        <div class="image-frame q-mb-md" ref="imageFrameRef">
            <q-img
                v-if="imageUrl"
                :src="imageUrl"
                class="image"
                spinner-color="primary"
                :ratio="null"
                fit="contain"
                @load="onImageLoad"
                ref="qImgRef"
            />
            <span v-else class="placeholder text-grey">Image will appear here</span>
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
                        X: {{ disk.center_x }} px, Y: {{ disk.center_y }} px
                    </div>
                    <div>Diameter: {{ disk.diameter_mm }}</div>
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
            <q-btn
                class="q-mt-md"
                label="Upload"
                color="primary"
                @click="uploadFile"
                :disabled="!file"
            />
            <q-btn
                class="q-mt-md q-ml-sm"
                label="Clear"
                color="negative"
                @click="clearFile"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import useMainStore from '../stores/main.store'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const file = ref(null)
const imageUrl = ref(null)
const zoiInfo = ref([])
const uploadMessage = ref('')
const uploadedFilename = ref('')
const qImgRef = ref(null)
const checkZoiResult = ref(null)

const mainStore = useMainStore();

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

const clearFile = () => {
    file.value = null
    imageUrl.value = null
    zoiInfo.value = []
    uploadMessage.value = ''
    uploadedFilename.value = ''
}

const uploadFile = async () => {
    if (!file.value) return

    try {
        checkZoiResult.value = await mainStore.checkZoI(file.value)
        if (checkZoiResult.value) {
            uploadMessage.value = checkZoiResult.value.message || ''
            uploadedFilename.value = checkZoiResult.value.filename || ''
            zoiInfo.value = checkZoiResult.value.zoi || []
        }
    } catch (error) {
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