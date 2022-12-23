import RichTextEditor from "@/components/common/RichTextEditor";
import { FILES_BASE_URL } from "@/config/url";
import useStore from "@/hooks/useStore";
import { getRequest, patchRequest, postRequest } from "@/lib/api";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";
import { toast } from "react-toastify";

const AddPostForm = ({ data }: { data?: Post }) => {
  const getImage = data?.article?.image.id;
  const getPreview = data?.article?.image.url;
  const [loading, setLoading] = React.useState(false);
  const user = useStore((state) => state.session?.user);
  const [tags, setTags] = React.useState<Tag[]>([{ id: "0", name: "default", _count: { posts: 0 } }]);
  const [image, setImage] = React.useState(getImage || "");
  const [preview, setPreview] = React.useState<string>(getPreview ? FILES_BASE_URL + getPreview : "");
  const [post, setPost] = React.useState<{ title?: string; content?: string; tags: string[] | null }>({
    title: data?.title || "",
    content: data?.content || "",
    tags: data?.tags?.map((el) => el.tag.name) || [],
  });

  const { push, locale, replace } = useRouter();

  const handleImageChange = async (e: any) => {
    setPreview(URL?.createObjectURL(e.target.files[0]));

    const formData = new FormData();
    formData.append("file", e.target.files[0], e.target.files[0].name);
    const response = await postRequest({ endpoint: "/files/upload", data: formData });
    if (response.error) {
      toast.error(response.error?.message);
    }
    if (response.data) {
      setImage(response.data?.id);
    }
  };

  const handleImageUpload = React.useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const response = await postRequest({ endpoint: "/files/upload", data: formData });
    if (response.error) {
      toast.error(response.error?.message);
    }
    return FILES_BASE_URL + response.data?.url;
  }, []);

  const handleChange = (event: { target: { value: string; name: string } }) => {
    setPost({ ...post, [event.target.name]: event.target.value });
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const response = data?.id
      ? await patchRequest({
          endpoint: `/posts/${data?.id}/preview`,
          data: { ...post, image, author: user?.id, type: "ARTICLE" },
        })
      : await postRequest({
          endpoint: "/posts",
          data: { ...post, image, author: user?.id, type: "ARTICLE", draft: true },
        });
    if (response.error) {
      setLoading(false);
      toast.error(response.error?.message);
    }
    if (response.data) {
      setLoading(false);
      toast.success(data?.title ? "Post updated" : "Post created");
      replace(`/articles/${response.data?.slug}`);
    }
  };

  const onPublish = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const response = data?.id
      ? await patchRequest({
          endpoint: `/posts/${data?.id}`,
          data: { ...post, image, author: user?.id, type: "ARTICLE" },
        })
      : await postRequest({
          endpoint: "/posts",
          data: { ...post, image, author: user?.id, type: "ARTICLE", draft: false },
        });
    if (response.error) {
      setLoading(false);
      toast.error(response.error?.message);
    }
    if (response.data) {
      setLoading(false);
      toast.success(data?.title ? "Post updated" : "Post created");
      replace(`/articles/${response.data?.slug}`);
    }
  };

  React.useEffect(() => {
    const getTags = async () => {
      const tags = await getRequest({ endpoint: "/tags" });
      if (!tags.error) {
        setTags(tags.data);
      }
    };

    getTags();

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, []);

  return (
    <Paper variant="outlined" component={Stack} spacing={2} sx={{ py: 1, p: 2 }}>
      <Stack
        justifyContent="center"
        alignItems="center"
        component="label"
        sx={{
          width: 1,
          height: image ? 240 : 160,
          bgcolor: "action.hover",
          position: "relative",
          cursor: "pointer",
          overflow: "hidden",
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
        }}
      >
        <input hidden accept="image/*" onChange={handleImageChange} type="file" />
        {preview ? (
          <Image src={preview} alt="Updev cmmunity" layout="fill" objectFit="cover" />
        ) : (
          <AddPhotoAlternateIcon color="primary" sx={{ fontSize: 140, opacity: 0.1 }} />
        )}
      </Stack>
      <Autocomplete
        multiple
        id="tags-filled"
        options={tags.map((el) => el.name)}
        freeSolo
        defaultValue={post.tags as any}
        onChange={(event: any, newValue: string[] | null) => {
          setPost((state) => ({ ...state, tags: newValue }));
        }}
        renderTags={(value: readonly string[], getTagProps) =>
          value.map((option: string, index: number) => (
            <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
          ))
        }
        renderInput={(params) => (
          <TextField
            sx={{ "&.MuiTextField-root > .MuiFilledInput-root": { px: 2, py: 1.5 } }}
            {...params}
            variant="filled"
            placeholder="Tags"
          />
        )}
      />
      <TextField
        name="title"
        variant="filled"
        value={post.title}
        placeholder={locale === "en" ? "Title" : "Titre"}
        onChange={handleChange}
        sx={{ "&.MuiTextField-root > .MuiFilledInput-root": { px: 2, pb: 1 } }}
      />
      <RichTextEditor
        value={post.content}
        onChange={(value) => setPost((state) => ({ ...state, content: value }))}
        stickyOffset={70}
        onImageUpload={handleImageUpload}
        id="rte"
        controls={[
          ["bold", "italic", "underline", "link", "code"],
          ["unorderedList", "orderedList", "sup", "sub"],
          ["codeBlock", "blockquote", "link"],
          ["image", "video", "strike"],
        ]}
      />
      <Stack spacing={2} direction="row" alignItems="center">
        <Button
          disableElevation
          color="primary"
          variant="contained"
          disabled={!post.title || !post.content || !post.tags?.length || loading}
          sx={{ px: 4, borderRadius: 50 }}
          onClick={onPublish}
        >
          {loading ? (locale === "en" ? "Loading..." : "Chargement") : locale === "en" ? "Publish" : "Publier"}
        </Button>

        <Button
          disableElevation
          color="secondary"
          variant="contained"
          disabled={!post.title || !post.content || !post.tags?.length || loading}
          sx={{ px: 4, borderRadius: 50 }}
          onClick={onSubmit}
        >
          {loading ? (locale === "en" ? "Loading..." : "Chargement") : locale === "en" ? "Save" : "Enregistrer"}
        </Button>

        <Button
          disableElevation
          color="inherit"
          variant="outlined"
          disabled={loading}
          sx={{ px: 4, borderRadius: 50 }}
          onClick={() => push({ pathname: "/posts" }, undefined, { shallow: true })}
        >
          {locale === "en" ? "Cancel" : "Annuler"}
        </Button>
      </Stack>
    </Paper>
  );
};

export default AddPostForm;
