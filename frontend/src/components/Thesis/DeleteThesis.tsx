import { Button, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { FiTrash2 } from "react-icons/fi"
import { useNavigate } from "@tanstack/react-router"

import { ThesisService } from "@/client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import useCustomToast from "@/hooks/useCustomToast"

const DeleteThesis = ({ id }: { id: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const navigate = useNavigate()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const deleteThesis = async () => {
    await ThesisService.deleteThesisTopic({ id })
  }

  const mutation = useMutation({
    mutationFn: deleteThesis,
    onSuccess: () => {
      showSuccessToast("Temat pracy dyplomowej został pomyślnie usunięty")
      setIsOpen(false)
      navigate({ to: "/thesis" })
    },
    onError: () => {
      showErrorToast("Wystąpił błąd podczas usuwania tematu pracy dyplomowej")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["thesis-topics"] })
    },
  })

  const onSubmit = async () => {
    mutation.mutate()
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      role="alertdialog"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" colorScheme="red">
          <FiTrash2 fontSize="16px" />
          Usuń pracę dyplomową
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogCloseTrigger />
          <DialogHeader>
            <DialogTitle>Usuń temat pracy dyplomowej</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Ten temat pracy dyplomowej zostanie trwale usunięty. Czy na pewno chcesz kontynuować? Nie będziesz mógł cofnąć tej akcji.
            </Text>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogCloseTrigger asChild>
              <Button variant="subtle" colorScheme="gray" disabled={isSubmitting}>
                Anuluj
              </Button>
            </DialogCloseTrigger>
            <Button
              variant="solid"
              colorScheme="red"
              type="submit"
              loading={isSubmitting}
            >
              Usuń
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteThesis
