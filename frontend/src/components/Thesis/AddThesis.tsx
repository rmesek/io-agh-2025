import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm, Controller } from "react-hook-form"
import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import { ThesisService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"
import { Radio, RadioGroup } from "../ui/radio"

interface ThesisCreateForm {
  title: string
  description?: string | null
  target_study_stage: "bachelor" | "master" | "any"
  slots_total: number
  slots_available: number
  status: "open" | "closed"
  language?: string | null
  department?: string | null
  keywords?: string // comma-separated string in UI
}

const AddThesis = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ThesisCreateForm>({
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      target_study_stage: "any",
      slots_total: 0,
      slots_available: 0,
      status: "open",
      language: "",
      department: "",
      keywords: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ThesisCreateForm) => {
      const { keywords, ...rest } = data

      const requestBody = {
        ...rest,
        keywords: keywords
          ? keywords
              .split(",")
              .map((k) => k.trim())
              .filter((k) => k.length > 0)
          : [],
      }

      return ThesisService.createThesisTopicMe({ requestBody })
    },
    onSuccess: () => {
      showSuccessToast("Thesis created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["thesis-topics"] })
    },
  })

  const onSubmit: SubmitHandler<ThesisCreateForm> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button my={4}>
          <FaPlus fontSize="16px" />
          Add Thesis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Thesis</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new thesis.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.title}
                errorText={errors.title?.message}
                label="Title"
              >
                <Input
                  id="title"
                  {...register("title", { required: "Title is required" })}
                  placeholder="Title"
                  type="text"
                />
              </Field>

              <Field label="Description">
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Description"
                  type="text"
                />
              </Field>

              <Field label="Target Study Stage">
                <Controller
                  name="target_study_stage"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup value={field.value} onChange={field.onChange}>
                      <Radio value="bachelor">Bachelor</Radio>
                      <Radio value="master">Master</Radio>
                      <Radio value="any">Any</Radio>
                    </RadioGroup>
                  )}
                />
              </Field>

              <Field label="Slots Total">
                <Input
                  type="number"
                  {...register("slots_total", { valueAsNumber: true })}
                  placeholder="Total Slots"
                />
              </Field>

              <Field label="Slots Available">
                <Input
                  type="number"
                  {...register("slots_available", { valueAsNumber: true })}
                  placeholder="Available Slots"
                />
              </Field>

              <Field label="Status">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup value={field.value} onChange={field.onChange}>
                      <Radio value="open">Open</Radio>
                      <Radio value="closed">Closed</Radio>
                    </RadioGroup>
                  )}
                />
              </Field>

              <Field label="Language">
                <Input
                  id="language"
                  {...register("language")}
                  placeholder="e.g., English"
                  type="text"
                />
              </Field>

              <Field label="Department">
                <Input
                  id="department"
                  {...register("department")}
                  placeholder="e.g., Computer Science"
                  type="text"
                />
              </Field>

              <Field label="Keywords (comma separated)">
                <Input
                  id="keywords"
                  {...register("keywords")}
                  placeholder="e.g., AI, Machine Learning, NLP"
                  type="text"
                />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddThesis
