import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeFollowState } from "../services/user";
import { keys } from "./queryKeys";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

/**
 * Mutate the state of the follow cache system
 * over a pair of users.
 * In order to do this action optimistically we mutate
 * the data as soon as the request is made, not waiting for the
 * firestore response.
 *
 * @param {Object} options to be passed along to useQuery
 * @returns
 */
export const useFollowingMutation = (
  options: Record<string, unknown> = {},
) => {
  const queryClient = useQueryClient();
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );

  const { onMutate, ...rest } = options as {
    onMutate?: (variables: any) => unknown | Promise<unknown>;
    [key: string]: unknown;
  };

  return useMutation({
    mutationFn: changeFollowState,
    ...rest,
    onMutate: async (variables) => {
      const userResult = onMutate ? await onMutate(variables) : undefined;

      if (!currentUserId) {
        console.error("No current user");
        return userResult;
      }

      queryClient.setQueryData(
        keys.userFollowing(currentUserId, variables.otherUserId),
        !variables.isFollowing,
      );

      return userResult;
    },
  });
};
