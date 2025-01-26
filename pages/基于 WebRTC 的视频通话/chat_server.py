#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""
Author: ShuSheng
Create Time: 2022-11-24
Info: 视频通话服务器
"""

import asyncio
from enum import Enum
import json
import websockets

SIGNALING_HOST = "localhost"
SIGNALING_PORT = "8888"

class Id:
    CALLER = "0"
    CALLEE = "1"

class MessageType:
    REQUESTOFFER = "RequestOffer"
    OFFER = "Offer"
    ANSWER = "Answer"
    CANDITATE = "Canditate"

class ChatServer:
    host = SIGNALING_HOST
    port = SIGNALING_PORT
    loop = None
    server = None
    # 用户的 websocket 集合
    # 假定只有两个用户，第一个用户是 caller，第二个用户是 callee
    websocket_users = list()

    def __init__(self, host, port):
        self.host = host
        self.port = port

    # 开启服务器
    def open(self):
        print("开始监听 " + SIGNALING_HOST + ":" + SIGNALING_PORT)
        self.loop = asyncio.get_event_loop()
        self.server = self.loop.run_until_complete(
            websockets.serve(self.run, SIGNALING_HOST, SIGNALING_PORT))
        try:
            self.loop.run_forever()
        except KeyboardInterrupt:
            self.close()

    # 关闭服务器
    def close(self):
        print("\n退出监听, 程序结束")
        self.server.close()
        self.loop.run_until_complete(self.server.wait_closed())
        self.loop.close()

    # 服务器端主逻辑
    async def run(self, websocket, path):
        # print("客户端请求, websocket: ", websocket, ", path: " + path)
        try:
            await self.join_room(websocket)
            await self.recv_user_msg(websocket)
        except websockets.ConnectionClosed:
            self.leave_room(websocket)
            return
        except websockets.InvalidState:
            print("InvalidState...") # 无效状态
            return
        except Exception as e:
            print("Exception:", e)
            return

    # 接收客户端消息并处理
    async def recv_user_msg(self, websocket):
        while True:
            message_origin = await websocket.recv()
            message = json.loads(message_origin)
            print("\n")
            print("reveive message:")
            print(message)
            if message['type'] == MessageType.OFFER:
                # offer信息，直接发送给 callee
                await self.send_msg(self.websocket_users[1], message_origin)
            elif message['type'] == MessageType.ANSWER:
                # answer信息，直接发送给 caller
                await self.send_msg(self.websocket_users[0], message_origin)
            elif message['type'] == MessageType.CANDITATE:
                # canditate 信息，判断身份
                if message['id'] == Id.CALLER:
                    await self.send_msg(self.websocket_users[1], message_origin)
                elif message['id'] == Id.CALLEE:
                    await self.send_msg(self.websocket_users[0], message_origin)
                else :
                    print("Invalid Id")
            else :
                print("Invalid message")

    # 发送数据
    async def send_msg(self, websocket, message):
        print("\n")
        print("send message to", websocket)
        print(message)
        await websocket.send(message)

    # 加入房间
    async def join_room(self, websocket):
        print("客户端", websocket, "加入房间")
        self.websocket_users.append(websocket)
        print("当前用户集: ", self.websocket_users)

        if len(self.websocket_users) >= 2:
            await self.beginChat()

    # 离开房间
    def leave_room(self, websocket):
        print("\n")
        print("客户端", websocket, "离开房间")
        self.websocket_users.remove(websocket)
        print("当前用户集: ", self.websocket_users)

    # 开始聊天, 向第一个用户请求offer
    async def beginChat(self):
        data = {"type": MessageType.REQUESTOFFER, "data": ""}
        await self.send_msg(self.websocket_users[0], json.dumps(data))


def main():
    server = ChatServer(SIGNALING_HOST, SIGNALING_PORT)
    server.open()

if __name__ == '__main__':
    main()