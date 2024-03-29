import { List, Typography, Button, Alert } from "antd";
import Axios from "axios";
import { drive_v3 } from "googleapis";
import React, { memo } from "react";

interface PermissionItemType {
  data: drive_v3.Schema$Permission;
  fileID: string;
}
function PermissionItem({ data, fileID }: PermissionItemType) {
  const [deleteing, setDeleteing] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);
  const deletePermission = () => {
    setDeleteing(true);
    Axios({
      method: "DELETE",
      url: `/api/drive/permissions/delete?fileID=${fileID}&permissionId=${data.id}`,
    }).then(() => {
      setDeleted(true);
    });
  };

  return (
    <List.Item
      hidden={
        // @ts-ignore
        (typeof data?.filterd === "boolean" && !data?.filterd) || deleted
      }
    >
      <Typography className="w-full overflow-hidden text-ellipsis text-sm">
        {data.emailAddress}
      </Typography>

      <Alert type="error" message={data.role} />
      <Button
        loading={deleteing}
        onClick={deletePermission}
        disabled={data.role === "owner"}
      >
        Delete
      </Button>
    </List.Item>
  );
}

export default memo(PermissionItem);
