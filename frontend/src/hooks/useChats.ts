import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setChats } from "../redux/slices/chatSlice";
import { chatsListener } from "../services/chat";
import { RootState } from "../redux/store";
import { Chat } from "../../types";

export const useChats = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);

  const handleChatsChange = useCallback(
    (data: Chat[]) => {
      dispatch(setChats(data));
    },
    [dispatch],
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (currentUser != null) {
      chatsListener(handleChatsChange, currentUser.uid).then((fn) => {
        unsubscribe = fn;
      });
    }

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [handleChatsChange, currentUser]);
};
