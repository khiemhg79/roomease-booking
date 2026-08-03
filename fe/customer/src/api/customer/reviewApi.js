import http from '../http'

export const reviewApi = {
    create: (payload) =>
        http
            .post('/reviews', payload)
            .then((response) => response.data.data),
}