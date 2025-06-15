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
      showSuccessToast("The thesis topic was deleted successfully")
      setIsOpen(false)
      navigate({ to: "/thesis" })
    },
    onError: () => {
      showErrorToast("An error occurred while deleting the thesis topic")
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
        <Button variant="ghost" size="sm" colorPalette="red">
          <FiTrash2 fontSize="16px" />
          Delete Thesis
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogCloseTrigger />
          <DialogHeader>
            <DialogTitle>Delete Thesis Topic</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              This thesis topic will be permanently deleted. Are you sure? You will not
              be able to undo this action.
            </Text>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogCloseTrigger asChild>
              <Button variant="subtle" colorPalette="gray" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogCloseTrigger>
            <Button
              variant="solid"
              colorPalette="red"
              type="submit"
              loading={isSubmitting}
            >
              Delete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteThesis
