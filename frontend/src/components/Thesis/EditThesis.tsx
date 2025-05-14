import {
  Button,
  ButtonGroup,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm, Controller } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"

import {
  type ApiError,
  type ThesisTopicPublic,
  ThesisService,
} from "@/client"
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

interface EditThesisProps {
  thesis: ThesisTopicPublic
}

interface ThesisUpdateForm {
  title?: string
  description?: string | null
  slots_total?: number
  slots_available?: number
  target_study_stage?: "bachelor" | "master" | "any"
  status?: "open" | "closed"
}

const EditThesis = ({ thesis }: EditThesisProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ThesisUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: thesis.title,
      slots_total: thesis.slots_total,
      slots_available: thesis.slots_available,
      description: thesis.description ?? undefined,
      target_study_stage: thesis.target_study_stage,
      status: thesis.status,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ThesisUpdateForm) =>
      ThesisService.updateThesisTopic({
        id: thesis.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Thesis updated successfully.")
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

  const onSubmit: SubmitHandler<ThesisUpdateForm> = (data) => {
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
          <FaExchangeAlt fontSize="16px" />
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
                  {...register("title", {
                    required: "Title is required",
                  })}
                  placeholder="Title"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
              >
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Description"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.target_study_stage}
                errorText={errors.target_study_stage?.message}
                label="Target Study Stage"
              >
                <Controller
                  name="target_study_stage"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onChange={(event) => {
                        // Rzutowanie event.target na HTMLInputElement
                        const value = (event.target as HTMLInputElement).value
                        setValue("target_study_stage", value as "bachelor" | "master" | "any")
                      }}
                    >
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
              <Field
                invalid={!!errors.status}
                errorText={errors.status?.message}
                label="Status"
              >
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onChange={(event) => {
                        // Rzutowanie event.target na HTMLInputElement
                        const value = (event.target as HTMLInputElement).value
                        setValue("status", value as "open" | "closed")
                      }}
                    >
                      <Radio value="open">Open</Radio>
                      <Radio value="closed">Closed</Radio>
                    </RadioGroup>
                  )}
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <ButtonGroup>
              <DialogTrigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="gray"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogTrigger>
              {/* <Button variant="solid" type="submit" isLoading={isSubmitting}>
                Save
              </Button> */}
            </ButtonGroup>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditThesis
