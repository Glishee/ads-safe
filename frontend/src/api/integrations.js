import { apiPost } from './adsGramm'


export const UploadFile = file => {
	const formData = new FormData()
	formData.append('file', file)
	return fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/upload`, {
		method: 'POST',
		body: formData,
		credentials: 'include',
	}).then(res => res.json())
}


export const InvokeLLM = prompt => apiPost('/llm', { prompt })


