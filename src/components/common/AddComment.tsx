import AddPost from "@/components/common/AddPost";
import Comment from "@/components/common/Comment";
import RichTextEditor from "@/components/common/RichTextEditor";
import { CallToActionSkeleton } from "@/components/middle/Skeleton";
import useSocket from "@/hooks/useSocket";
import useStore from "@/hooks/useStore";
import useUser from "@/hooks/useUser";
import { deleteRequest, getRequest, postRequest } from "@/lib/api";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useCallback } from "react";
import { toast } from "react-toastify";

const CallToAction = dynamic(import("@/components/middle/CallToAction"), {
  ssr: false,
  loading: () => <CallToActionSkeleton />,
});

const AddComment: React.FC<{ data: Post }> = ({ data }) => {
  const session = useStore((state) => state.session?.user);
  const user = useUser(session?.username);
  const [showCommentForm, setShowCommentForm] = React.useState(false);
  const [comments, setComments] = React.useState<PostComment[] | []>([]);
  const [comment, setComment] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const { push, locale } = useRouter();
  const socket = useSocket();

  const handleClose = () => {
    setOpen(false);
  };

  const handleCleanComment = () => {
    setComment("");
    setShowCommentForm(false);
  };

  const handleShowComment = useCallback(() => {
    if (session?.id) {
      setShowCommentForm(true);
    } else {
      setOpen(true);
    }
  }, []);

  const handleDeleteComment = async (id: string) => {
    const response = await deleteRequest({ endpoint: `/comments/${id}` });
    if (response.error) {
      toast.error(response.error?.message);
    }
    if (response.data) {
      setComments((state) => state.filter((el) => el.id !== id));
    }
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    const response = await postRequest({
      endpoint: "/comments",
      data: { content: comment, author: user?.id, post: data.id },
    });
    if (response.error) {
      toast.error(response.error?.message);
    }
    if (response.data) {
      socket.emit("notification", {
        notificationFromUser: user,
        id: Date.now().toString(),
        post: data,
        type: "COMMENT",
      });
      setComments((state) => [...state, response.data]);
      handleCleanComment();
    }
  };

  React.useEffect(() => {
    async function getComment() {
      const res = await getRequest({ endpoint: `/comments/${data.id}/post-comments` });
      if (res.error) {
        console.log(res.error);
      }
      setComments(res.data);
    }
    getComment();
  }, []);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <CallToAction />
      </Dialog>
      <Stack spacing={2} sx={{ py: 1 }}>
        <Typography variant="h6" color="text.primary">
          {locale === "en" ? "Comments" : "Commentaires"} ({comments.length})
        </Typography>

        {showCommentForm ? (
          <Paper
            variant="outlined"
            sx={{ p: 2, position: "sticky", top: 75, zIndex: 999 }}
            component={Stack}
            spacing={2}
          >
            <RichTextEditor
              value={comment}
              controls={[
                ["bold", "italic", "underline", "link", "codeBlock"],
                ["unorderedList", "orderedList", "sup", "sub", "code"],
              ]}
              onChange={(value) => setComment(value)}
              stickyOffset={70}
              id="rte"
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" sx={{ px: 2 }} disableElevation onClick={() => setShowCommentForm(false)}>
                {locale === "en" ? "Cancel" : "Annuler"}
              </Button>
              <Button variant="contained" sx={{ px: 2 }} disableElevation onClick={onSubmit}>
                {locale === "en" ? "Comment" : "Commenter"}
              </Button>
            </Stack>
          </Paper>
        ) : (
          <AddPost
            label={locale === "en" ? "Leave a comment" : "Laisser un commentaire"}
            handleClick={handleShowComment}
          />
        )}

        {comments?.map((el) => (
          <React.Fragment key={el.id}>
            <Comment data={el} />
          </React.Fragment>
        ))}
      </Stack>
    </>
  );
};

export default AddComment;
