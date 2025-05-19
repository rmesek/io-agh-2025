import {
  Button,
  ButtonGroup,
  DialogActionTrigger,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { type SubmitHandler, useForm, Controller } from "react-hook-form"
import { FaEdit } from "react-icons/fa"
import type { ThesisTopicPublic } from "@/client"

import { type ApiError, ThesisService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"
import { Radio, RadioGroup } from "../ui/radio"

interface ThesisType {
  id: string
  title: string
  description?: string | null
  target_study_stage: "bachelor" | "master" | "any"
  slots_total: number
  slots_available: number
  status: "open" | "closed"
  language?: string | null
  department?: string | null
  keywords?: string[]
}

interface ThesisEditForm {
  title: string
  description?: string | null
  target_study_stage: "bachelor" | "master" | "any"
  slots_total: number
  slots_available: number
  status: "open" | "closed"
  language?: string | null
  department?: string | null
  keywords?: string // comma separated string in form
}

interface EditThesisProps {
  thesisId: string
}

const EditThesis = ({ thesisId }: EditThesisProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [thesisData, setThesisData] = useState<ThesisType | null>(null)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ThesisEditForm>({
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

  useEffect(() => {
    if (isOpen) {
      ThesisService.readThesisTopic({ id: thesisId })
        .then((t: ThesisTopicPublic) => {
          setThesisData(t)
          reset({
            title: t.title,
            description: t.description ?? "",
            target_study_stage: t.target_study_stage.toLowerCase() as
              | "bachelor"
              | "master"
              | "any",
            slots_total: t.slots_total,
            slots_available: t.slots_available,
            status: t.status,
            language: t.language ?? "",
            department: t.department ?? "",
            keywords: t.keywords ? (Array.isArray(t.keywords) ? t.keywords.join(", ") : "") : "",
          })
        })
        .catch((err: ApiError) => {
          handleError(err)
        })
    }
  }, [isOpen, thesisId, reset])

  const mutation = useMutation({
    mutationFn: (formData: ThesisEditForm) => {
      // Zamiana keywords string na tablicę
      const keywordsArray = formData.keywords
        ? formData.keywords
            .split(",")
            .map(k => k.trim())
            .filter(k => k.length > 0)
        : []

      const { keywords, ...rest } = formData

      return ThesisService.updateThesisTopic({
        id: thesisId,
        requestBody: {
          ...rest,
          keywords: keywordsArray,
        },
      })
    },
    onSuccess: () => {
      showSuccessToast("Thesis updated successfully.")
      setIsOpen(false)
      queryClient.invalidateQueries({ queryKey: ["thesis-topics"] })
      queryClient.invalidateQueries({ queryKey: ["thesis-topic", thesisId] })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const onSubmit: SubmitHandler<ThesisEditForm> = (data) => {
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
        <Button variant="ghost">
          <FaEdit fontSize="16px" />
          Edit Thesis
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Thesis</DialogTitle>
          </DialogHeader>

          <DialogBody>
            <Text mb={4}>Update the thesis details below.</Text>
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

              <Field invalid={!!errors.description} errorText={errors.description?.message} label="Description">
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
                  {...register("slots_total", { valueAsNumber: true, min: 0 })}
                  placeholder="Total Slots"
                />
              </Field>

              <Field label="Slots Available">
                <Input
                  type="number"
                  {...register("slots_available", { valueAsNumber: true, min: 0 })}
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
            <ButtonGroup>
              <DialogActionTrigger asChild>
                <Button variant="subtle" colorScheme="gray" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button variant="solid" type="submit" loading={isSubmitting} disabled={!isValid}>
                Save
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditThesis
