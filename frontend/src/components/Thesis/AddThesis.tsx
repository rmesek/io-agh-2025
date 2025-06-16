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
  keywords?: string // ciąg znaków oddzielony przecinkami w UI
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
      showSuccessToast("Temat pracy dyplomowej został pomyślnie utworzony.")
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
          Dodaj pracę dyplomową
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Dodaj pracę dyplomową</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Wypełnij dane, aby dodać nowy temat pracy dyplomowej.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.title}
                errorText={errors.title?.message}
                label="Tytuł"
              >
                <Input
                  id="title"
                  {...register("title", { required: "Tytuł jest wymagany" })}
                  placeholder="Tytuł"
                  type="text"
                />
              </Field>

              <Field label="Opis">
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Opis"
                  type="text"
                />
              </Field>

              <Field label="Docelowy etap studiów">
                <Controller
                  name="target_study_stage"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup value={field.value} onChange={field.onChange}>
                      <Radio value="bachelor">Licencjat</Radio>
                      <Radio value="master">Magister</Radio>
                      <Radio value="any">Dowolny</Radio>
                    </RadioGroup>
                  )}
                />
              </Field>

              <Field label="Liczba miejsc ogółem">
                <Input
                  type="number"
                  {...register("slots_total", { valueAsNumber: true })}
                  placeholder="Liczba miejsc ogółem"
                />
              </Field>

              <Field label="Liczba dostępnych miejsc">
                <Input
                  type="number"
                  {...register("slots_available", { valueAsNumber: true })}
                  placeholder="Liczba dostępnych miejsc"
                />
              </Field>

              <Field label="Status">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup value={field.value} onChange={field.onChange}>
                      <Radio value="open">Otwarte</Radio>
                      <Radio value="closed">Zamknięte</Radio>
                    </RadioGroup>
                  )}
                />
              </Field>

              <Field label="Język">
                <Input
                  id="language"
                  {...register("language")}
                  placeholder="np. Angielski"
                  type="text"
                />
              </Field>

              <Field label="Wydział">
                <Input
                  id="department"
                  {...register("department")}
                  placeholder="np. Informatyka"
                  type="text"
                />
              </Field>

              <Field label="Słowa kluczowe (oddzielone przecinkami)">
                <Input
                  id="keywords"
                  {...register("keywords")}
                  placeholder="np. AI, Uczenie maszynowe, NLP"
                  type="text"
                />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorScheme="gray"
                disabled={isSubmitting}
              >
                Anuluj
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
            >
              Zapisz
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddThesis
