import { SettingFilled, FileFilled, FolderTwoTone } from "@ant-design/icons";
import { Col, Dropdown, Menu, Row, Typography } from "antd";
import { drive_v3 } from "googleapis";
import { memo } from "react";
import { useToggle } from "react-use";
import EditAccess from "../EditAccess";
import NextLink from "next/link";
import AddAccess from "../AddAccess";

function FileItem({ data, i }: { data: drive_v3.Schema$File; i: number }) {
  const [hover, setHover] = useToggle(false);
  const isFolder = data.mimeType === "application/vnd.google-apps.folder";

  // @ts-ignore
  return (
    <Col
      className="flex h-10 w-full max-w-4xl flex-row justify-between gap-3"
      style={{
        background: `${i % 2 === 0 ? "rgba(0,0,0,0.1)" : ""}`,
      }}
      key={data.id}
    >
      <Dropdown
        placement="topLeft"
        trigger={["click"]}
        overlay={
          <Menu
            items={[
              {
                label: (
                  <a target="_blank" href={data.webViewLink || ""}>
                    Open
                  </a>
                ),
                key: "0",
              },
              {
                label: <EditAccess id={data.id || ""} />,
                key: "1",
              },
              {
                label: <AddAccess id={data.id || ""} />,
                key: "2",
              },
            ]}
          />
        }
      >
        <Row className="pointer flex w-14 items-center justify-center bg-slate-200">
          <SettingFilled className="text-xl hover:cursor-pointer" />
        </Row>
      </Dropdown>
      {!isFolder && (
        <Typography className="flex h-full flex-1 flex-row items-center align-middle">
          <FileFilled className="mx-0 my-auto text-lg" />
          <Typography className="w-full overflow-hidden text-clip text-sm">
            {data.name}
          </Typography>
        </Typography>
      )}
      {isFolder && (
        <Typography className="flex h-full flex-1 align-middle ">
          <NextLink href={`/explore?id=${data.id}`}>
            <a className="mx-2 my-0 flex flex-row">
              <FolderTwoTone className="mx-0 my-3 text-xl" />
              <Typography className="hidden w-full text-ellipsis text-sm">
                {data.name}
              </Typography>
            </a>
          </NextLink>
        </Typography>
      )}
    </Col>
  );
}

export default memo(FileItem);
