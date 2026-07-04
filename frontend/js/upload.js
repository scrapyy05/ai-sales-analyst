/**
 * ==========================================================================
 * AI Sales Analyst — CSV Upload Controller (js/upload.js)
 * Modern drag-and-drop upload with animated border and upload history
 * ==========================================================================
 */

class UploadController {
    static selectedFile = null;

    static init() {
        if (!Auth.guard()) return;

        const dropzone = document.getElementById('upload-dropzone');
        const fileInput = document.getElementById('csv-file-input');
        const uploadBtn = document.getElementById('start-upload-btn');
        const removeBtn = document.getElementById('remove-file-btn');

        if (!dropzone || !fileInput) return;

        // Drag & Drop events
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                UploadController.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        dropzone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                UploadController.handleFileSelect(fileInput.files[0]);
            }
        });

        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            UploadController.selectedFile = null;
            fileInput.value = '';
            document.getElementById('file-preview-card').classList.add('hidden');
            dropzone.classList.remove('hidden');
            document.getElementById('upload-status-box').classList.add('hidden');
        });

        uploadBtn.addEventListener('click', async () => {
            await UploadController.submitUpload();
        });

        UploadController.loadUploadHistory();
    }

    static handleFileSelect(file) {
        if (!file.name.endsWith('.csv')) {
            UI.showToast("Invalid file format. Please upload a valid .csv dataset.", "danger");
            return;
        }

        UploadController.selectedFile = file;
        document.getElementById('file-name-display').textContent = file.name;
        document.getElementById('file-size-display').textContent = Utils.formatFileSize(file.size);
        
        document.getElementById('upload-dropzone').classList.add('hidden');
        document.getElementById('file-preview-card').classList.remove('hidden');
        document.getElementById('upload-status-box').classList.add('hidden');
    }

    static async submitUpload() {
        if (!UploadController.selectedFile) return;

        const uploadBtn = document.getElementById('start-upload-btn');
        const statusBox = document.getElementById('upload-status-box');
        
        uploadBtn.textContent = "⚡ Ingesting & Parsing CSV...";
        uploadBtn.disabled = true;
        statusBox.classList.add('hidden');

        const formData = new FormData();
        formData.append('file', UploadController.selectedFile);

        const overwrite = document.getElementById('overwrite-checkbox')?.checked || false;
        const startTime = new Date();

        try {
            const res = await API.post(`/upload/csv?overwrite=${overwrite}`, formData);
            
            uploadBtn.textContent = "⚡ Start ETL Ingestion";
            uploadBtn.disabled = false;

            const count = res ? (res.records_inserted || "Multiple") : "Multiple";
            const modeMsg = res && res.overwritten ? " (Overwrote previous sales records)" : "";
            
            statusBox.className = "alert alert-success animate-slide-up mt-4";
            statusBox.innerHTML = `
                <span style="font-size: 20px;">✅</span>
                <div>
                    <strong>ETL Ingestion Successful!</strong><br>
                    Successfully inserted <strong>${count}</strong> sales records into PostgreSQL${modeMsg}. Redis Query Cache was automatically cleared.
                </div>
            `;
            statusBox.classList.remove('hidden');

            UI.showToast(`🎉 Ingested ${count} records${modeMsg}! Dashboard metrics updated.`, "success");

            // Save to LocalStorage Upload History
            UploadController.saveToHistory({
                fileName: UploadController.selectedFile.name,
                fileSize: Utils.formatFileSize(UploadController.selectedFile.size),
                records: count,
                timestamp: startTime.toISOString(),
                status: 'Success'
            });

            UploadController.loadUploadHistory();

        } catch (error) {
            uploadBtn.textContent = "⚡ Start ETL Ingestion";
            uploadBtn.disabled = false;

            statusBox.className = "alert alert-danger animate-slide-up mt-4";
            statusBox.innerHTML = `
                <span style="font-size: 20px;">❌</span>
                <div>
                    <strong>Ingestion Failed!</strong><br>
                    ${error.message || "Could not parse or insert CSV records. Check file formatting."}
                </div>
            `;
            statusBox.classList.remove('hidden');

            UploadController.saveToHistory({
                fileName: UploadController.selectedFile.name,
                fileSize: Utils.formatFileSize(UploadController.selectedFile.size),
                records: 0,
                timestamp: startTime.toISOString(),
                status: 'Failed'
            });

            UploadController.loadUploadHistory();
        }
    }

    static saveToHistory(item) {
        let history = JSON.parse(localStorage.getItem('upload_history') || '[]');
        history.unshift(item);
        if (history.length > 10) history = history.slice(0, 10);
        localStorage.setItem('upload_history', JSON.stringify(history));
    }

    static loadUploadHistory() {
        const tbody = document.getElementById('upload-history-tbody');
        if (!tbody) return;

        const history = JSON.parse(localStorage.getItem('upload_history') || '[]');
        if (history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px;">No CSV datasets uploaded in this session yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map(h => `
            <tr>
                <td style="font-weight: 600;">${h.fileName}</td>
                <td class="text-muted">${h.fileSize}</td>
                <td><span class="badge ${h.status === 'Success' ? 'badge-success' : 'badge-danger'}">${h.status}</span></td>
                <td>${h.records} records</td>
                <td class="text-muted">${Utils.formatDate(h.timestamp)}</td>
            </tr>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('upload.html')) {
        UploadController.init();
    }
});
