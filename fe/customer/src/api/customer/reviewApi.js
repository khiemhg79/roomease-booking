import http from '../http'

const unwrap = (response) => response.data.data

export const reviewApi = {
    create: (payload) =>
        http
            .post('/reviews', payload)
            .then(unwrap),

    status: (bookingIds) => {
        if (!bookingIds?.length) {
            return Promise.resolve({
                reviewedBookingIds: [],
            })
        }

        return http
            .post(
                '/reviews/status',
                {
                    bookingIds,
                },
            )
            .then(unwrap)
    },
}

export default reviewApi