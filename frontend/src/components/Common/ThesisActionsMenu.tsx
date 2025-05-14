import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

import type { ThesisTopicPublic } from "@/client"
import DeleteThesis from "../Thesis/DeleteThesis"
import EditThesis from "../Thesis/EditThesis"

interface ThesisActionsMenuProps {
  thesis: ThesisTopicPublic
}

export const ThesisActionsMenu = ({ thesis }: ThesisActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditThesis thesis={thesis} />
        <DeleteThesis id={thesis.id} />
      </MenuContent>
    </MenuRoot>
  )
}