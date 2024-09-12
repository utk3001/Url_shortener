import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    token: null,
}

export const shortSlice = createSlice({
    name: 'short',
    initialState,
    reducers: {
        short: (state, action) => {
            state.user = action.payload.others
            state.token = action.payload.token
        }
    }
})

export const { short } = shortSlice.actions

export default shortSlice.reducer