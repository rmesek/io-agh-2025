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
  slots_total: number
  slots_available: number
  target_study_stage: "bachelor" | "master" | "any"
  status: "open" | "closed"
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
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ThesisCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      slots_total: 0,
      slots_available: 0,
      target_study_stage: "any",
      status: "open",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ThesisCreateForm) =>
      ThesisService.createThesisTopic({ requestBody: data }), // Send data to API
    onSuccess: () => {
      showSuccessToast("Thesis created successfully.") // Success message
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err) // Handle errors
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["thesis-topics"] }) // Invalidate cached data
    },
  })

  const onSubmit: SubmitHandler<ThesisCreateForm> = (data) => {
    mutation.mutate(data) // Trigger the mutation on submit
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-thesis" my={4}>
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
          {...register("title", {
            required: "Title is required.",
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

          <Field
            invalid={!!errors.status}
            errorText={errors.status?.message}
            label="Status"
          >
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
          loading={isSubmitting} // Zmiana isLoading na loading
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
