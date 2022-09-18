import {configureStore} from '@reduxjs/toolkit';
import bluetoothReducer from './features/bluetooth/bluetoothSlice';
import bleDataReducer from './features/bleData/bleDataSlice';

export const store = configureStore({
  reducer: {
    bluetooth: bluetoothReducer,
    bleData: bleDataReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
